import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const record = await prisma.dataStore.findUnique({
      where: { key: "metricas-propostas" },
    });

    if (!record || !record.data) {
      return NextResponse.json({
        total: 0,
        clientsCount: 0,
        byClient: {},
        recent: [],
      });
    }

    return NextResponse.json(record.data);
  } catch (error) {
    console.error("Erro ao buscar propostas:", error);
    return NextResponse.json(
      { total: 0, clientsCount: 0, byClient: {}, recent: [] },
      { status: 500 }
    );
  }
}