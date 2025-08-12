import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { storylines } from "@/lib/storylines";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type GenerateBody = {
  storylineId?: string;
  caption?: string;
  lastAssistantText?: string;
  pc?: { name?: string; role?: string } | null;
};

type OpenAIImageResponse = {
  data?: Array<{ url?: string; b64_json?: string }>;
};

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: chatId } = await context.params;
    const { storylineId, caption, lastAssistantText, pc }: GenerateBody = await req.json();

    const chat = await prisma.chat.findUnique({ where: { id: chatId } });
    if (!chat) return NextResponse.json({ error: "Chat not found" }, { status: 404 });

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

    const saveOrReturn = async (url: string, meta?: { placeholder?: boolean; error?: string }) => {
      try {
        const image = await prisma.sceneImage.create({ data: { chatId, url, caption } });
        return NextResponse.json({ image, persisted: true, placeholder: !!meta?.placeholder, error: meta?.error || null });
      } catch (err) {
        console.error("DB save failed, returning non-persisted image", err);
        return NextResponse.json({ image: { url, caption }, persisted: false, placeholder: !!meta?.placeholder, error: meta?.error || (err as Error).message });
      }
    };

    if (!OPENAI_API_KEY) {
      return saveOrReturn("/window.svg", { placeholder: true, error: "No OPENAI_API_KEY configured" });
    }

    const storyline = storylines.find((s) => s.id === storylineId);
    const setting = storyline
      ? `${storyline.title}, ${storyline.era}${storyline.location ? ", " + storyline.location : ""}`
      : "Historical fiction scene";

    const pcLine = pc?.name && pc?.role ? `${pc.name}, ${pc.role}` : undefined;
    const summary = lastAssistantText?.slice(0, 500) || caption || "Dramatic moment in the story.";

    const prompt = `Illustration, cinematic, detailed matte painting.\nSetting: ${setting}.\n${pcLine ? `Protagonist: ${pcLine}.` : ""}\nScene: ${summary}\nStyle: painterly, realistic lighting, film grain.\nContent rules: PG-13, avoid graphic violence or sexual content.`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    };
    if (process.env.OPENAI_ORG) headers["OpenAI-Organization"] = process.env.OPENAI_ORG as string;
    if (process.env.OPENAI_PROJECT) headers["OpenAI-Project"] = process.env.OPENAI_PROJECT as string;

    const MODEL_PRIMARY = process.env.OPENAI_IMAGE_MODEL || "gpt-image-1";
    const MODEL_FALLBACK = MODEL_PRIMARY === "dall-e-3" ? "gpt-image-1" : "dall-e-3";

    async function tryGenerate(model: string) {
      const upstream = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers,
        body: JSON.stringify({ model, prompt, size: "1024x1024", n: 1, response_format: "url" }),
      });
      const errText = !upstream.ok ? await upstream.text().catch(() => "") : "";
      if (!upstream.ok) throw new Error(`OpenAI error ${upstream.status} (${model}): ${errText}`);
      const data = (await upstream.json().catch(() => null)) as OpenAIImageResponse | null;
      const url: string | undefined = data?.data?.[0]?.url;
      if (!url) throw new Error(`No image URL returned (${model})`);
      return url;
    }

    try {
      let url = await tryGenerate(MODEL_PRIMARY);
      return saveOrReturn(url, { placeholder: false });
    } catch (err1) {
      console.warn("Primary image model failed, retrying with fallback:", (err1 as Error).message);
      try {
        const url = await tryGenerate(MODEL_FALLBACK);
        return saveOrReturn(url, { placeholder: false });
      } catch (err2) {
        const message = `${(err1 as Error).message} | ${(err2 as Error).message}`;
        console.error("Both image models failed, using placeholder:", message);
        return saveOrReturn("/window.svg", { placeholder: true, error: message });
      }
    }
  } catch (e) {
    console.error("/api/chats/[id]/images/generate POST error", e);
    return NextResponse.json({ error: "Failed to generate image" }, { status: 500 });
  }
}
