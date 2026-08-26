import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";

// GET /api/garden -> Lista todos os crons
export async function GET() {
  try {
    // Busca do DataStore a chave hermes-crons ou retorna lista padrão
    const store = await prisma.dataStore.findUnique({
      where: { key: "hermes-crons" },
    });

    const crons = store?.data ? (store.data as any) : [];
    return NextResponse.json({ ok: true, crons });
  } catch (error: any) {
    console.error("Erro ao listar crons:", error);
    return NextResponse.json({ ok: false, crons: [], error: error.message }, { status: 500 });
  }
}

// POST /api/garden -> Adiciona novo cron
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, schedule, command, description, enabled = true } = body;

    if (!name || !schedule || !command) {
      return NextResponse.json(
        { error: "Nome, schedule (cron) e comando são obrigatórios." },
        { status: 400 }
      );
    }

    const store = await prisma.dataStore.findUnique({
      where: { key: "hermes-crons" },
    });

    const currentCrons = store?.data && Array.isArray(store.data) ? (store.data as any[]) : [];

    const newCron = {
      id: randomUUID(),
      name: name.trim(),
      schedule: schedule.trim(),
      command: command.trim(),
      description: description?.trim() || "",
      enabled: Boolean(enabled),
      lastRun: null,
      createdAt: new Date().toISOString(),
    };

    const updatedCrons = [...currentCrons, newCron];

    await prisma.dataStore.upsert({
      where: { key: "hermes-crons" },
      create: {
        key: "hermes-crons",
        data: updatedCrons as any,
        updatedAt: new Date(),
      },
      update: {
        data: updatedCrons as any,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ ok: true, cron: newCron });
  } catch (error: any) {
    console.error("Erro ao salvar cron:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/garden -> Alterna status ativo/pausado
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, enabled } = body;

    const store = await prisma.dataStore.findUnique({
      where: { key: "hermes-crons" },
    });

    const currentCrons = store?.data && Array.isArray(store.data) ? (store.data as any[]) : [];
    const updatedCrons = currentCrons.map((c) =>
      c.id === id ? { ...c, enabled: Boolean(enabled) } : c
    );

    await prisma.dataStore.update({
      where: { key: "hermes-crons" },
      data: {
        data: updatedCrons as any,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/garden?id=xxx -> Remove um cron
export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID obrigatório" }, { status: 400 });
    }

    const store = await prisma.dataStore.findUnique({
      where: { key: "hermes-crons" },
    });

    const currentCrons = store?.data && Array.isArray(store.data) ? (store.data as any[]) : [];
    const updatedCrons = currentCrons.filter((c) => c.id !== id);

    await prisma.dataStore.update({
      where: { key: "hermes-crons" },
      data: {
        data: updatedCrons as any,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}