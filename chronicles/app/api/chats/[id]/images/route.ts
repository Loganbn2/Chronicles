import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: chatId } = await context.params;
    const { url, caption }: { url?: string; caption?: string } = await req.json();
    if (!url) return NextResponse.json({ error: "Missing url" }, { status: 400 });

    // ensure chat exists
    const chat = await prisma.chat.findUnique({ where: { id: chatId } });
    if (!chat) return NextResponse.json({ error: "Chat not found" }, { status: 404 });

    const image = await prisma.sceneImage.create({
      data: { url, caption, chatId },
    });
    return NextResponse.json({ image });
  } catch (e) {
    console.error("/api/chats/[id]/images POST error", e);
    return NextResponse.json({ error: "Failed to save image" }, { status: 500 });
  }
}

export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: chatId } = await context.params;
    const images = await prisma.sceneImage.findMany({
      where: { chatId },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json({ images });
  } catch (e) {
    console.error("/api/chats/[id]/images GET error", e);
    return NextResponse.json({ error: "Failed to fetch images" }, { status: 500 });
  }
}
