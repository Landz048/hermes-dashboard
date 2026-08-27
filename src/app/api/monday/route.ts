import { NextResponse } from 'next/server';

const BOARD_IDS = {
  jornada: '18417081179',
  contratos: '18417081210',
  propostas: '18417081220',
  standBy: '18417079843',
  comercial: '18417081172',
};

export async function GET() {
  const token = process.env.MONDAY_API_TOKEN;

  if (!token) {
    return NextResponse.json({ error: 'Token não configurado' }, { status: 500 });
  }

  // Busca os itens, grupos e valores de colunas dos quadros selecionados
  const query = `
    query {
      boards(ids: [${Object.values(BOARD_IDS).join(',')}]) {
        id
        name
        items_page(limit: 100) {
          items {
            id
            name
            group {
              id
              title
            }
            column_values {
              id
              text
              type
            }
          }
        }
      }
    }
  `;

  try {
    const res = await fetch('https://api.monday.com/v2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token,
        'API-Version': '2024-04',
      },
      body: JSON.stringify({ query }),
      next: { revalidate: 60 },
    });

    const data = await res.json();
    const boards = data?.data?.boards || [];

    const getBoard = (id: string) => boards.find((b: any) => b.id === id);

    // Contagens básicas para os cards numéricos
    const metrics = {
      projetosJornada: getBoard(BOARD_IDS.jornada)?.items_page?.items?.length ?? 0,
      contratos: getBoard(BOARD_IDS.contratos)?.items_page?.items?.length ?? 0,
      propostas: getBoard(BOARD_IDS.propostas)?.items_page?.items?.length ?? 0,
      standBy: getBoard(BOARD_IDS.standBy)?.items_page?.items?.length ?? 0,
    };

    // Agrupamento para Gráfico 1: Pipeline Comercial por Fase / Grupo
    const comercialBoard = getBoard(BOARD_IDS.comercial);
    const comercialItems = comercialBoard?.items_page?.items || [];
    const comercialFasesMap: Record<string, number> = {};

    comercialItems.forEach((item: any) => {
      const grupo = item.group?.title || 'Outros';
      comercialFasesMap[grupo] = (comercialFasesMap[grupo] || 0) + 1;
    });

    const pipelineComercial = Object.entries(comercialFasesMap).map(([name, value]) => ({
      name,
      value,
    }));

    // Agrupamento para Gráfico 2: Projetos por Fase — Jornada
    const jornadaBoard = getBoard(BOARD_IDS.jornada);
    const jornadaItems = jornadaBoard?.items_page?.items || [];
    const jornadaFasesMap: Record<string, number> = {};

    jornadaItems.forEach((item: any) => {
      const grupo = item.group?.title || 'Outros';
      jornadaFasesMap[grupo] = (jornadaFasesMap[grupo] || 0) + 1;
    });

    const projetosJornadaFases = Object.entries(jornadaFasesMap).map(([name, value]) => ({
      name,
      value,
    }));

    return NextResponse.json({
      metrics,
      pipelineComercial,
      projetosJornadaFases,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}