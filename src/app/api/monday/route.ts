import { NextResponse } from 'next/server';

const BOARD_IDS = {
  jornada: '18417081179',
  contratos: '18417081210',
  propostas: '18417081220',
  standBy: '18417079843',
};

export async function GET() {
  const token = process.env.MONDAY_API_TOKEN;

  if (!token) {
    return NextResponse.json({ error: 'Token não configurado' }, { status: 500 });
  }

  const query = `
    query {
      boards(ids: [${Object.values(BOARD_IDS).join(',')}]) {
        id
        name
        items_page(limit: 100) {
          items {
            id
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
      next: { revalidate: 60 }, // Revalida a cada 1 minuto
    });

    const data = await res.json();
    const boards = data?.data?.boards || [];

    const getCountById = (id: string) => {
      const b = boards.find((item: any) => item.id === id);
      return b?.items_page?.items?.length ?? 0;
    };

    const metrics = {
      projetosJornada: getCountById(BOARD_IDS.jornada),
      contratos: getCountById(BOARD_IDS.contratos),
      propostas: getCountById(BOARD_IDS.propostas),
      standBy: getCountById(BOARD_IDS.standBy),
    };

    return NextResponse.json(metrics);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}