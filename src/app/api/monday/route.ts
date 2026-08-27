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
              value
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

    // 1. Métricas principais (Cards)
    const metrics = {
      projetosJornada: getBoard(BOARD_IDS.jornada)?.items_page?.items?.length ?? 0,
      contratos: getBoard(BOARD_IDS.contratos)?.items_page?.items?.length ?? 0,
      propostas: getBoard(BOARD_IDS.propostas)?.items_page?.items?.length ?? 0,
      standBy: getBoard(BOARD_IDS.standBy)?.items_page?.items?.length ?? 0,
    };

    // 2. Pipeline Comercial por Fase & Carga por Responsável
    const comercialItems = getBoard(BOARD_IDS.comercial)?.items_page?.items || [];
    const comercialMap: Record<string, number> = {};
    const responsaveisMap: Record<string, number> = {};

    comercialItems.forEach((item: any) => {
      const grupo = item.group?.title?.trim() || 'Outros';
      comercialMap[grupo] = (comercialMap[grupo] || 0) + 1;

      // Busca qualquer coluna de pessoa/responsável que tenha texto preenchido
      const personCol = item.column_values?.find((c: any) => {
        const isPeopleType = c.type === 'people' || c.type === 'multiple-person';
        const isPeopleName = c.id?.toLowerCase().includes('person') || 
                             c.id?.toLowerCase().includes('responsavel') ||
                             c.id?.toLowerCase().includes('owner') ||
                             c.id?.toLowerCase().includes('user');
        return (isPeopleType || isPeopleName) && Boolean(c.text && c.text.trim() !== '');
      });

      // Se achou texto direto (ex: "John", "Felipe"), usa ele. Senão busca qualquer coluna de texto preenchida com nomes conhecidos
      let respName = personCol?.text?.trim();

      if (!respName) {
        // Fallback: procura se alguma coluna contém nomes dos responsáveis conhecidos
        const anyColWithName = item.column_values?.find((c: any) => 
          c.text && (c.text.includes('John') || c.text.includes('Felipe') || c.text.includes('Thiago'))
        );
        respName = anyColWithName?.text?.trim() || 'Sem responsável';
      }

      // Se houver mais de uma pessoa na mesma célula (separadas por vírgula)
      const peopleList = respName.split(',').map((p: string) => p.trim()).filter(Boolean);
      peopleList.forEach((person: string) => {
        responsaveisMap[person] = (responsaveisMap[person] || 0) + 1;
      });
    });

    const pipelineComercial = Object.entries(comercialMap).map(([name, value]) => ({ name, value }));
    const cargaResponsavel = Object.entries(responsaveisMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // 3. Projetos por Fase — Jornada
    const jornadaItems = getBoard(BOARD_IDS.jornada)?.items_page?.items || [];
    const jornadaMap: Record<string, number> = {};
    jornadaItems.forEach((item: any) => {
      const grupo = item.group?.title?.trim() || 'Outros';
      jornadaMap[grupo] = (jornadaMap[grupo] || 0) + 1;
    });
    const projetosJornadaFases = Object.entries(jornadaMap).map(([name, value]) => ({ name, value }));

    // 4. Contratos por Status
    const contratosItems = getBoard(BOARD_IDS.contratos)?.items_page?.items || [];
    const contratosMap: Record<string, number> = {};
    contratosItems.forEach((item: any) => {
      const grupo = item.group?.title?.trim() || 'Ativos';
      contratosMap[grupo] = (contratosMap[grupo] || 0) + 1;
    });
    const contratosStatus = Object.entries(contratosMap).map(([name, value]) => ({ name, value }));

    // 5. Propostas — Progresso
    const propostasItems = getBoard(BOARD_IDS.propostas)?.items_page?.items || [];
    const propostasMap: Record<string, number> = {};
    propostasItems.forEach((item: any) => {
      const grupo = item.group?.title?.trim() || 'Em elaboração';
      propostasMap[grupo] = (propostasMap[grupo] || 0) + 1;
    });
    const propostasProgresso = Object.entries(propostasMap).map(([name, value]) => ({ name, value }));

    return NextResponse.json({
      metrics,
      pipelineComercial,
      projetosJornadaFases,
      contratosStatus,
      cargaResponsavel,
      propostasProgresso,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}