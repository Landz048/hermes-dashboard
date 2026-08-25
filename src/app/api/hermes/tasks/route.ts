import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
    console.error("Erro ao buscar tarefas hermes:", error);
    return NextResponse.json({ tasks: [], error: error.message }, { status: 500 });
  }
}