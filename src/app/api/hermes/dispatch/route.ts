import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      kind = "user_prompt",
      title,
      prompt,
      text,
      message,
      sideEffecting = false,
    } = body;

    const finalPrompt = prompt || text || message || title || "";
    const finalTitle =
      title ||
      (typeof finalPrompt === "string" && finalPrompt.length > 0
        ? finalPrompt.slice(0, 80)
        : "Nova solicitação");

    if (!finalPrompt && !finalTitle) {
      return NextResponse.json(
        { error: "É necessário informar ao menos um comando ou prompt." },
        { status: 400 }
      );
    }

    const request = await prisma.agentRequest.create({
      data: {
        kind,
        title: finalTitle,
        prompt: finalPrompt,
        sideEffecting: Boolean(sideEffecting),
        status: sideEffecting ? "awaiting_approval" : "queued",
      },
    });

    return NextResponse.json({ ok: true, request });
  } catch (error: any) {
    console.error("Erro no dispatch:", error);
    return NextResponse.json(
      { error: error?.message || "Falha interna ao criar requisição" },
      { status: 500 }
    );
  }
}