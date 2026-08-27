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
              color
            }
            column_values {
              id
              text
              type
              value
            }
            subitems {
              id
              name
              group {
                id
                title
                color
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

    // Métricas principais
    const countTotal = (id: string) => {
      const b = getBoard(id);
      const items = b?.items_page?.items || [];
      const subitemsCount = items.reduce((acc: number, it: any) => acc + (it.subitems?.length || 0), 0);
      return items.length + subitemsCount;
    };

    const metrics = {
      projetosJornada: countTotal(BOARD_IDS.jornada),
      contratos: countTotal(BOARD_IDS.contratos),
      propostas: countTotal(BOARD_IDS.propostas),
      standBy: countTotal(BOARD_IDS.standBy),
    };

    // Pipeline Comercial & Carga
    const comercialBoard = getBoard(BOARD_IDS.comercial);
    const comercialItems = comercialBoard?.items_page?.items || [];
    const comercialMap: Record<string, number> = {};
    const countsMap: Record<string, number> = {};
    TEAM_ORDER.forEach((m) => { countsMap[m] = 0; });

    comercialItems.forEach((item: any) => {
      const grupo = item.group?.title?.trim() || 'Outros';
      comercialMap[grupo] = (comercialMap[grupo] || 0) + 1;

      item.column_values?.forEach((col: any) => {
        if (col.text) {
          const normText = normalizeStr(col.text);
          TEAM_ORDER.forEach((member) => {
            if (normText.includes(normalizeStr(member))) {
              countsMap[member] = (countsMap[member] || 0) + 1;
            }
          });
        }
      });
    });

    const pipelineComercial = Object.entries(comercialMap).map(([name, value]) => ({ name, value }));
    const cargaResponsavel = TEAM_ORDER.map((name) => ({
      name,
      value: countsMap[name] || 0,
    }));

    // Projetos por Fase — Jornada
    const jornadaBoard = getBoard(BOARD_IDS.jornada);
    const jornadaItems = jornadaBoard?.items_page?.items || [];
    const jornadaMap: Record<string, number> = {};
    jornadaItems.forEach((item: any) => {
      const grupo = item.group?.title?.trim() || 'Outros';
      jornadaMap[grupo] = (jornadaMap[grupo] || 0) + 1;
    });
    const projetosJornadaFases = Object.entries(jornadaMap).map(([name, value]) => ({ name, value }));

    // Contratos por Status
    const contratosBoard = getBoard(BOARD_IDS.contratos);
    const contratosItems = contratosBoard?.items_page?.items || [];
    const contratosMap: Record<string, number> = {};
    contratosItems.forEach((item: any) => {
      const grupo = item.group?.title?.trim() || 'Ativos';
      contratosMap[grupo] = (contratosMap[grupo] || 0) + 1;
    });
    const contratosStatus = Object.entries(contratosMap).map(([name, value]) => ({ name, value }));

    // Propostas — Progresso
    const propostasBoard = getBoard(BOARD_IDS.propostas);
    const propostasItems = propostasBoard?.items_page?.items || [];
    const propostasMap: Record<string, number> = {};
    propostasItems.forEach((item: any) => {
      const grupo = item.group?.title?.trim() || 'Em elaboração';
      propostasMap[grupo] = (propostasMap[grupo] || 0) + 1;
    });
    const propostasProgresso = Object.entries(propostasMap).map(([name, value]) => ({ name, value }));

    // Tarefas em Aberto na ordem exata do widget Monday
    const targetBoards = [
      { key: 'standBy', name: 'Stand By' },
      { key: 'comercial', name: 'Comercial' },
      { key: 'jornada', name: 'Jornada de Acompanhamento' },
      { key: 'contratos', name: 'Contratos' },
      { key: 'propostas', name: 'Propostas' },
    ];

    const tarefasEmAberto: Array<{
      id: string;
      name: string;
      group: string;
      groupColor: string;
      board: string;
    }> = [];

    targetBoards.forEach(({ key, name }) => {
      const b = getBoard((BOARD_IDS as any)[key]);
      if (!b) return;

      (b.items_page?.items || []).forEach((it: any) => {
        tarefasEmAberto.push({
          id: it.id,
          name: it.name,
          group: it.group?.title || 'Principal',
          groupColor: it.group?.color || '#00ca72',
          board: name,
        });

        (it.subitems || []).forEach((sub: any) => {
          tarefasEmAberto.push({
            id: sub.id,
            name: `↳ ${sub.name}`,
            group: sub.group?.title || 'Subelemento',
            groupColor: sub.group?.color || '#579bfc',
            board: name,
          });
        });
      });
    });

    return NextResponse.json({
      metrics,
      pipelineComercial,
      projetosJornadaFases,
      contratosStatus,
      cargaResponsavel,
      propostasProgresso,
      tarefasEmAberto,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}