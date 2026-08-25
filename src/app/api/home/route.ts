import { NextResponse } from "next/server";

export async function GET() {
  try {
    const data = {
      topBuildIdeas: [],
      polyBalance: 0,
      polyWinRate: 0,
      polyTodayPnl: 0,
      polyAllTimePnl: 0,
      allTimePnl: 0,
      todayPnl: 0,
      processes: [],
      hermesKanban: {
        board: "Quadro Geral",
        slug: "quadro-geral",
        total: 0,
        counts: {},
        tasks: [],
      },
    };

    return NextResponse.json(data);
  } catch (error) {
    console.error("Erro na rota /api/home:", error);
    return NextResponse.json({ error: "Falha ao carregar dados" }, { status: 500 });
  }
}