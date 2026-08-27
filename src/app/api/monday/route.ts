import { NextResponse } from 'next/server';

const BOARD_IDS = {
  jornada: '18417081179',
  contratos: '18417081210',
  propostas: '18417081220',
  standBy: '18417079843',
  comercial: '18417081172',
};

const TEAM_ORDER = ['John', 'Felipe', 'Natália', 'André', 'Clara', 'Diogo'];

function normalizeStr(str: string) {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

export async function GET() {
  const token = process.env.MONDAY_API_TOKEN;

  if (!token) {
    return NextResponse.json({ error: 'Token não configurado' }, { status: 500 });
  }

  const query = `
    query {
      users {
        id
        name
      }
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
    const usersList = data?.data?.users || [];

    const usersMap = new Map<string, string>();
    usersList.forEach((u: any) => usersMap.set(String(u.id), u.name));

    const getBoard = (id: string) => boards.find((b: any) => b.id === id);

    // 1. Cards
    const metrics = {
      projetosJornada: getBoard(BOARD_IDS.jornada)?.items_page?.items?.length ?? 0,
      contratos: getBoard(BOARD_IDS.contratos)?.items_page?.items?.length ?? 0,
      propostas: getBoard(BOARD_IDS.propostas)?.items_page?.items?.length ?? 0,
      standBy: getBoard(BOARD_IDS.standBy)?.items_page?.items?.length ?? 0,
    };

    // 2. Comercial por Fase & Carga por Responsável
    const comercialItems = getBoard(BOARD_IDS.comercial)?.items_page?.items || [];
    const comercialMap: Record<string, number> = {};
    const countsMap: Record<string, number> = {};

    TEAM_ORDER.forEach((m) => { countsMap[m] = 0; });

    comercialItems.forEach((item: any) => {
      const grupo = item.group?.title?.trim() || 'Outros';
      comercialMap[grupo] = (comercialMap[grupo] || 0) + 1;

      item.column_values?.forEach((col: any) => {
        // Checagem por texto direto
        if (col.text) {
          const normText = normalizeStr(col.text);
          TEAM_ORDER.forEach((member) => {
            if (normText.includes(normalizeStr(member))) {
              countsMap[member] = (countsMap[member] || 0) + 1;
            }
          });
        }
        // Checagem por ID de usuário dentro do JSON
        if (col.value && (col.type === 'people' || col.type === 'multiple-person')) {
          try {
            const parsed = JSON.parse(col.value);
            parsed?.personsAndTeams?.forEach((p: any) => {
              const uName = usersMap.get(String(p.id)) || '';
              const normName = normalizeStr(uName);
              TEAM_ORDER.forEach((member) => {
                if (normName.includes(normalizeStr(member))) {
                  countsMap[member] = (countsMap[member] || 0) + 1;
                }
              });
            });
          } catch (_) {}
        }
      });
    });

    const pipelineComercial = Object.entries(comercialMap).map(([name, value]) => ({ name, value }));
    const cargaResponsavel = TEAM_ORDER.map((name) => ({
      name,
      value: countsMap[name] || 0,
    }));

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