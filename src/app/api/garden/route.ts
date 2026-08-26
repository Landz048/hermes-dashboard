import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";

// GET /api/garden -> Lista os crons salvos no Neon
export async function GET() {
  try {
    const store = await prisma.dataStore.findUnique({
      where: { key: "hermes-crons" },
    });

    const crons = store?.data && Array.isArray(store.data) ? store.data : [];
    return NextResponse.json({ ok: true, crons });
  } catch (error: any) {
    console.error("Erro ao listar crons:", error);
    return NextResponse.json(
      { ok: false, crons: [], error: error.message || "Erro desconhecido" },
      { status: 500 }
    );
  }
}

// POST /api/garden -> Envia ordem de execução para a VPS
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { command, name } = body;

    if (!command) {
      return NextResponse.json({ error: "Comando é obrigatório" }, { status: 400 });
    }

    const titleText = `Executar Cron: ${name || command}`.slice(0, 200);
    const isBriefing = command.includes("briefing.generate");

    // Cria requisição na fila com campos padrão do schema
    const request = await prisma.agentRequest.create({
      data: {
        id: randomUUID(),
        title: titleText,
        prompt: isBriefing ? "briefing.generate" : `cron:${command}`,
        kind: isBriefing ? "briefing.generate" : "cron.trigger",
        status: "queued",
        agent: "hermes",
        priority: 3,
      },
    });

    return NextResponse.json({ ok: true, requestId: request.id });
  } catch (error: any) {
    console.error("Erro ao criar AgentRequest para o cron:", error);
    return NextResponse.json(
      { ok: false, error: error.message || "Erro ao gravar na fila" },
      { status: 500 }
    );
  }
}