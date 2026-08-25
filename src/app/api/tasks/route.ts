import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";

// GET /api/tasks -> Lista tarefas
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const board = url.searchParams.get("board") || "default";

    const tasks = await prisma.hermesTask.findMany({
      where: { board },
      orderBy: [{ priority: "desc" }, { updatedAt: "desc" }],
    });

    return NextResponse.json({ tasks });
  } catch (error: any) {
    console.error("Erro ao listar tarefas:", error);
    return NextResponse.json({ tasks: [], error: error.message }, { status: 500 });
  }
}

// POST /api/tasks -> Cria nova tarefa
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      title,
      description,
      status = "todo",
      priority = 1,
      assignee = "Hermes",
      board = "default",
    } = body;

    if (!title || !title.trim()) {
      return NextResponse.json(
        { error: "O título da tarefa é obrigatório." },
        { status: 400 }
      );
    }

    const task = await prisma.hermesTask.create({
      data: {
        id: randomUUID(),
        board: board || "default",
        title: title.trim(),
        assignee: assignee || null,
        status: status.toLowerCase(),
        priority: Number(priority) || 1,
        result: description || null,
        updatedAt: new Date(),
        syncedAt: new Date(),
      },
    });

    return NextResponse.json({ ok: true, task });
  } catch (error: any) {
    console.error("Erro ao criar tarefa:", error);
    return NextResponse.json(
      { error: error?.message || "Falha ao criar tarefa no banco" },
      { status: 500 }
    );
  }
}

// PATCH /api/tasks -> Atualiza o status/dados da tarefa (Drag & Drop)
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, status, priority, title, assignee } = body;

    if (!id) {
      return NextResponse.json({ error: "ID é obrigatório" }, { status: 400 });
    }

    const updated = await prisma.hermesTask.update({
      where: { id },
      data: {
        ...(status && { status: status.toLowerCase() }),
        ...(priority !== undefined && { priority: Number(priority) }),
        ...(title && { title: title.trim() }),
        ...(assignee !== undefined && { assignee }),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ ok: true, task: updated });
  } catch (error: any) {
    console.error("Erro ao atualizar tarefa:", error);
    return NextResponse.json(
      { error: error?.message || "Falha ao atualizar tarefa" },
      { status: 500 }
    );
  }
}

// DELETE /api/tasks?id=xxx -> Exclui tarefa
export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "ID da tarefa é obrigatório" },
        { status: 400 }
      );
    }

    await prisma.hermesTask.delete({
      where: { id },
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("Erro ao excluir tarefa:", error);
    return NextResponse.json(
      { error: error?.message || "Falha ao excluir tarefa" },
      { status: 500 }
    );
  }
}