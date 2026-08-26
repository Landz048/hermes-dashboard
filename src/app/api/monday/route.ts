import { NextResponse } from 'next/server';

export async function GET() {
  const token = process.env.MONDAY_API_TOKEN;

  if (!token) {
    return NextResponse.json(
      { error: 'MONDAY_API_TOKEN não configurado no ambiente' },
      { status: 500 }
    );
  }

  // GraphQL query para buscar os quadros e a contagem de itens de cada um
  const query = `
    query {
      boards {
        id
        name
        items_count
      }
    }
  `;

  try {
    const res = await fetch('https://api.monday.com/v2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token,
        'API-Version': '2024-04'
      },
      body: JSON.stringify({ query }),
      next: { revalidate: 300 } // Revalida o cache a cada 5 minutos
    });

    const data = await res.json();
    const boards = data?.data?.boards || [];

    // Função auxiliar para encontrar a contagem pelo nome aproximado do quadro
    const getCount = (nameMatch: string) => {
      const board = boards.find((b: any) =>
        b.name.toLowerCase().includes(nameMatch.toLowerCase())
      );
      return board?.items_count ?? 0;
    };

    const metrics = {
      projetosJornada: getCount('Jornada de Acompanhamento'),
      contratos: getCount('Contratos'),
      propostas: getCount('Propostas'),
      standBy: getCount('Stand By'),
    };

    return NextResponse.json(metrics);
  } catch (error) {
    return NextResponse.json(
      { error: 'Falha ao consultar a API do Monday' },
      { status: 500 }
    );
  }
}