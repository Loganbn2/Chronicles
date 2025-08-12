import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { chatToDTO, pcToDbFields } from "@/lib/mappers";
import type { PlayerCharacter } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/chats -> create a chat with optional PC snapshot
export async function POST(req: NextRequest) {
  const body = (await req.json()) as {
    title?: string;
    storylineId?: string;
    pc?: PlayerCharacter | null;
  };

  const chat = await prisma.chat.create({
    data: {
      title: body.title || "Untitled Chat",
      storylineId: body.storylineId || null,
      ...pcToDbFields(body.pc),
    },
  });

  return new Response(JSON.stringify({ chat: chatToDTO(chat) }), {
    headers: { "Content-Type": "application/json" },
  });
}

// GET /api/chats -> list chats (no auth yet)
export async function GET() {
  const chats = await prisma.chat.findMany({ orderBy: { updatedAt: "desc" }, take: 50 });
  return new Response(JSON.stringify({ chats: chats.map(chatToDTO) }), {
    headers: { "Content-Type": "application/json" },
  });
}
