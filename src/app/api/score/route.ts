import { NextResponse } from "next/server";

export async function GET() {
  // Retorna nulo para não exibir métricas falsas/zeradas enquanto o servidor não alimenta
  return NextResponse.json(null);
}