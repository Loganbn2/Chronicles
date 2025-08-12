// @ts-nocheck
import { NextRequest } from "next/server";
import { Message, PlayerCharacter, Storyline } from "@/types";

export const dynamic = "force-dynamic";

function buildSystemPrompt(storyline?: Storyline, pc?: PlayerCharacter | null) {
  const base = `You are a collaborative historical fiction narrator and roleplay companion.
- Stay PG-13. Avoid graphic violence or sexual content.
- Be respectful and sensitive to culture and history.
- Offer vivid, sensory description, but keep turns concise (3–8 sentences).
- Advance the scene and end with an in-world prompt or question.
- If the user asks for facts, be honest about uncertainty.
`;
  const ctx = storyline
    ? `\nSetting\nTitle: ${storyline.title}\nEra: ${storyline.era}$${storyline.location ? `\nLocation: ${storyline.location}` : ""}\nDescription: ${storyline.description}\nHook: ${storyline.starterHook}\nSafety tools: ${(storyline.safetyTools || []).join(", ")}`
    : "";
  const pcLine = pc
    ? `\nPlayer Character\nName: ${pc.name}\nRole: ${pc.role}\nBackground: ${pc.background}${pc.goals ? `\nGoals: ${pc.goals}` : ""}${(pc.traits && pc.traits.length) ? `\nTraits: ${pc.traits.join(", ")}` : ""}${pc.skills?.length ? `\nSkills: ${pc.skills.join(", ")}` : ""}${pc.allegiances ? `\nAllegiances: ${pc.allegiances}` : ""}${pc.era ? `\nEra: ${pc.era}` : ""}`
    : "";
  return base + ctx + pcLine;
}

function deterministicReply(messages: Message[], storyline?: Storyline, pc?: PlayerCharacter | null) {
  const last = messages.filter((m) => m.role === "user").at(-1)?.content ?? "";
  const title = storyline ? `${storyline.title} — ${storyline.era}` : "Freeform";
  const pcLine = pc ? ` You are roleplaying as ${pc.name}, ${pc.role}.` : "";
  const hook = storyline?.starterHook ? ` Hook: ${storyline.starterHook}` : "";
  return `Setting: ${title}.${pcLine}${hook}\n\nYou said: ${last}\n\nA thoughtful, in-character reply follows with historical color and sensory detail.`;
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as {
    messages: Message[];
    storylineId?: string;
    playerCharacter?: PlayerCharacter | null;
    chatId?: string;
  };

  let storyline: Storyline | undefined;
  try {
    const { storylines } = await import("@/lib/storylines");
    storyline = storylines.find((s) => s.id === body.storylineId);
  } catch {}

  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  if (!OPENAI_API_KEY) {
    const content = deterministicReply(body.messages || [], storyline, body.playerCharacter || null);
    // Do not persist here; client saves the final assistant message
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(content));
        controller.close();
      },
    });
    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  }

  // Build chat history
  const sys = buildSystemPrompt(storyline, body.playerCharacter || null);
  const history = (body.messages || [])
    .filter((m) => m.role === "user" || m.role === "assistant")
    .slice(-20)
    .map((m) => ({ role: m.role, content: m.content }));

  const payload = {
    model: "gpt-4o-mini",
    stream: true,
    temperature: 0.7,
    messages: [{ role: "system", content: sys }, ...history],
  };

  const upstream = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify(payload),
  });

  if (!upstream.ok || !upstream.body) {
    const errText = await upstream.text().catch(() => "");
    return new Response(`Error from OpenAI: ${upstream.status} ${errText}`, { status: 500 });
  }

  const stream = new ReadableStream({
    async start(controller) {
      const reader = upstream.body.getReader();
      const encoder = new TextEncoder();
      const decoder = new TextDecoder();
      let acc = "";
      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          acc += decoder.decode(value, { stream: true });
          const lines = acc.split("\n");
          acc = lines.pop() || "";
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data:")) continue;
            const data = trimmed.slice(5).trim();
            if (data === "[DONE]") continue;
            try {
              const json = JSON.parse(data);
              const token = json.choices?.[0]?.delta?.content ?? "";
              if (token) controller.enqueue(encoder.encode(token));
            } catch {}
          }
        }
        // Do not persist here; client saves the final assistant message after stream ends
        controller.close();
      } catch (e) {
        controller.error(e);
      }
    },
  });

  return new Response(stream, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } });
}
