import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { storylines } from "@/lib/storylines";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = {
  storylineId?: string;
  pc?: { name?: string; role?: string; background?: string; traits?: string[]; era?: string } | null;
};

type OpenAIImageResponse = { data?: Array<{ url?: string; b64_json?: string }> };

type Params = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: Params) {
  try {
    const { id: chatId } = await ctx.params;
    const { storylineId, pc }: Body = await req.json();

    const chat = await prisma.chat.findUnique({ where: { id: chatId } });
    if (!chat) return NextResponse.json({ error: "Chat not found" }, { status: 404 });

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    const saveOrReturn = async (url: string, meta?: { placeholder?: boolean; error?: string }) => {
      const caption = pc?.name ? `Portrait: ${pc.name}${pc.role ? ", " + pc.role : ""}${pc?.era ? " — " + pc.era : ""}` : "Portrait";
      try {
        // Remove any prior portraits for this chat (keep only latest)
        await prisma.sceneImage.deleteMany({
          where: { chatId, caption: { startsWith: "Portrait" } },
        });
        const image = await prisma.sceneImage.create({ data: { chatId, url, caption } });
        return NextResponse.json({ image, persisted: true, placeholder: !!meta?.placeholder, error: meta?.error || null });
      } catch (err) {
        console.error("DB save failed (portrait), returning non-persisted", err);
        return NextResponse.json({ image: { url, caption }, persisted: false, placeholder: !!meta?.placeholder, error: meta?.error || (err as Error).message });
      }
    };

    if (!OPENAI_API_KEY) {
      return saveOrReturn("/window.svg", { placeholder: true, error: "No OPENAI_API_KEY configured" });
    }

    const storyline = storylines.find((s) => s.id === storylineId);
    const setting = storyline ? `${storyline.title}, ${storyline.era}${storyline.location ? ", " + storyline.location : ""}` : pc?.era || "Historical fiction";

    const traits = (pc?.traits || []).slice(0, 5).join(", ");
    const details = [pc?.role, traits, pc?.background?.slice(0, 140)].filter(Boolean).join("; ");
    const name = pc?.name || "Protagonist";

    const prompt = `Portrait of ${name}. ${details}.
Setting context: ${setting}.
Medium: character concept art, medium shot, 3/4 view, face visible.
Style: painterly realism, soft natural light, neutral background, film grain.
Content rules: PG-13; no graphic content.`;

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
      const url = await tryGenerate(MODEL_PRIMARY);
      return saveOrReturn(url, { placeholder: false });
    } catch (err1) {
      console.warn("Primary portrait model failed, retrying with fallback:", (err1 as Error).message);
      try {
        const url = await tryGenerate(MODEL_FALLBACK);
        return saveOrReturn(url, { placeholder: false });
      } catch (err2) {
        const message = `${(err1 as Error).message} | ${(err2 as Error).message}`;
        console.error("Both portrait models failed, using placeholder:", message);
        return saveOrReturn("/window.svg", { placeholder: true, error: message });
      }
    }
  } catch (e) {
    console.error("/api/chats/[id]/images/generate-portrait POST error", e);
    return NextResponse.json({ error: "Failed to generate portrait" }, { status: 500 });
  }
}
