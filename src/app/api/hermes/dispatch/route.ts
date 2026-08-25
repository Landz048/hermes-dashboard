import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST { kind?, title, prompt?, sideEffecting? }
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { kind = "user_prompt", title, prompt, sideEffecting = false } = body;

    if (!title && !prompt) {
      return NextResponse.json(
        { error: "É necessário informar ao menos um título ou prompt." },
        { status: 400 }
      );
    }

    const request = await prisma.agentRequest.create({
      data: {
        kind,
        title: title || prompt?.slice(0, 80) || "Nova solicitação",
        prompt: prompt || title,
        sideEffecting: Boolean(sideEffecting),
        status: sideEffecting ? "awaiting_approval" : "queued",
      },
    });

    return NextResponse.json({ ok: true, request });
  } catch (error) {
    console.error("Erro no dispatch:", error);
    return NextResponse.json(
      { error: "Falha interna ao criar requisição" },
      { status: 500 }
    );
  }
}