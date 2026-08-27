import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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
        items_page(limit: 250, query_params: { rules: [{ column_id: "state", compare_value: ["active"], operator: any_of }] }) {
          items {
            id
            name
            state
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
              state
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
    });

    const data = await res.json();
    const boards = data?.data?.boards || [];
    const usersList = data?.data?.users || [];

    const usersMap = new Map<string, string>();
    usersList.forEach((u: any) => usersMap.set(String(u.id), u.name));

    const getBoard = (id: string) => boards.find((b: any) => b.id === id);

    // =========================================================================
    // 1. CARDS DO TOPO (Métricas Independentes - Itens Principais Ativos)
    // =========================================================================
    const metrics = {
      projetosJornada: getBoard(BOARD_IDS.jornada)?.items_page?.items?.filter((i: any) => !i.state || i.state === 'active').length ?? 0, // 10
      contratos: getBoard(BOARD_IDS.contratos)?.items_page?.items?.filter((i: any) => !i.state || i.state === 'active').length ?? 0,       // 42
      propostas: getBoard(BOARD_IDS.propostas)?.items_page?.items?.filter((i: any) => !i.state || i.state === 'active').length ?? 0,       // 18
      standBy: getBoard(BOARD_IDS.standBy)?.items_page?.items?.filter((i: any) => !i.state || i.state === 'active').length ?? 0,           // 9
    };

    // =========================================================================
    // 2. GRÁFICO 1: Pipeline Comercial por Fase
    // =========================================================================
    const comercialBoard = getBoard(BOARD_IDS.comercial);
    const comercialItems = (comercialBoard?.items_page?.items || []).filter((i: any) => !i.state || i.state === 'active');
    const comercialMap: Record<string, number> = {};

    comercialItems.forEach((item: any) => {
      const statusCol = item.column_values?.find(
        (c: any) => (c.type === 'status' || c.type === 'color' || c.id === 'status') && c.text
      );
      const fase = statusCol?.text?.trim() || item.group?.title?.trim() || 'Outros';
      comercialMap[fase] = (comercialMap[fase] || 0) + 1;
    });

    const pipelineComercial = Object.entries(comercialMap).map(([name, value]) => ({ name, value }));

    // =========================================================================
    // 3. GRÁFICO 2: Projetos por Fase — Jornada
    // =========================================================================
    const jornadaBoard = getBoard(BOARD_IDS.jornada);
    const jornadaItems = (jornadaBoard?.items_page?.items || []).filter((i: any) => !i.state || i.state === 'active');
    const jornadaMap: Record<string, number> = {};

    jornadaItems.forEach((item: any) => {
      const statusCol = item.column_values?.find(
        (c: any) => (c.type === 'status' || c.type === 'color' || c.id === 'status') && c.text
      );
      const fase = statusCol?.text?.trim() || item.group?.title?.trim() || 'Outros';
      jornadaMap[fase] = (jornadaMap[fase] || 0) + 1;
    });

    const projetosJornadaFases = Object.entries(jornadaMap).map(([name, value]) => ({ name, value }));

    // =========================================================================
    // 4. GRÁFICO 3: Contratos por Status
    // =========================================================================
    const contratosBoard = getBoard(BOARD_IDS.contratos);
    const contratosItems = (contratosBoard?.items_page?.items || []).filter((i: any) => !i.state || i.state === 'active');
    const contratosMap: Record<string, number> = {};

    contratosItems.forEach((item: any) => {
      const statusCol = item.column_values?.find(
        (c: any) => (c.type === 'status' || c.type === 'color' || c.id === 'status') && c.text
      );
      const status = statusCol?.text?.trim() || item.group?.title?.trim() || 'Ativos';
      contratosMap[status] = (contratosMap[status] || 0) + 1;
    });

    const contratosStatus = Object.entries(contratosMap).map(([name, value]) => ({ name, value }));

    // =========================================================================
    // 5. GRÁFICO 4: Carga por Responsável — Comercial
    // =========================================================================
    const countsMap: Record<string, number> = {};
    TEAM_ORDER.forEach((m) => { countsMap[m] = 0; });

    comercialItems.forEach((item: any) => {
      item.column_values?.forEach((col: any) => {
        if (col.text && (col.type === 'people' || col.type === 'multiple-person' || col.id?.includes('person') || col.id?.includes('responsavel'))) {
          const normText = normalizeStr(col.text);
          TEAM_ORDER.forEach((member) => {
            if (normText.includes(normalizeStr(member))) {
              countsMap[member] = (countsMap[member] || 0) + 1;
            }
          });
        }
      });
    });

    const cargaResponsavel = TEAM_ORDER.map((name) => ({
      name,
      value: countsMap[name] || 0,
    }));

    // =========================================================================
    // 6. GRÁFICO 5: Propostas — Progresso (Extração Direta da Coluna de Status)
    // =========================================================================
    const propostasBoard = getBoard(BOARD_IDS.propostas);
    const propostasItems = (propostasBoard?.items_page?.items || []).filter((i: any) => !i.state || i.state === 'active');
    const propostasMap: Record<string, number> = {};

    propostasItems.forEach((item: any) => {
      // Busca prioritariamente a coluna de status/progresso da proposta
      const statusCol = item.column_values?.find(
        (c: any) => (c.type === 'status' || c.type === 'color' || c.id === 'status' || c.id === 'progresso') && c.text
      );
      
      const status = statusCol?.text?.trim() || item.group?.title?.trim() || 'Em elaboração';
      propostasMap[status] = (propostasMap[status] || 0) + 1;
    });

    const propostasProgresso = Object.entries(propostasMap).map(([name, value]) => ({ name, value }));

    // =========================================================================
    // 7. TABELA: Tarefas em Aberto
    // =========================================================================
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

      (b.items_page?.items || []).filter((it: any) => !it.state || it.state === 'active').forEach((it: any) => {
        tarefasEmAberto.push({
          id: it.id,
          name: it.name,
          group: it.group?.title || 'Principal',
          groupColor: it.group?.color || '#00ca72',
          board: name,
        });

        (it.subitems || []).filter((sub: any) => !sub.state || sub.state === 'active').forEach((sub: any) => {
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