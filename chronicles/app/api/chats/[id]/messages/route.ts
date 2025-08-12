import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import type { Message } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/chats/:id/messages -> append a message
export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id: chatId } = await context.params;
  const body = (await req.json()) as { message: Pick<Message, "role" | "content" | "id"> };

  const saved = await prisma.message.create({
    data: {
      chatId,
      role: body.message.role,
      content: body.message.content,
    },
  });

  // bump updatedAt
  await prisma.chat.update({ where: { id: chatId }, data: { updatedAt: new Date() } });

  return new Response(JSON.stringify({ message: saved }), {
    headers: { "Content-Type": "application/json" },
  });
}

// GET /api/chats/:id/messages -> fetch messages
export async function GET(_: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id: chatId } = await context.params;
  const messages = await prisma.message.findMany({ where: { chatId }, orderBy: { createdAt: "asc" } });
  return new Response(JSON.stringify({ messages }), {
    headers: { "Content-Type": "application/json" },
  });
}
