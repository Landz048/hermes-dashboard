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

const VALID_CONTRATOS_STATUS: Record<string, string> = {
  'assinado': 'Assinado',
  'ag. assinatura': 'Ag. Assinatura',
  'ag assinatura': 'Ag. Assinatura',
  'em elaboracao': 'Em elaboração',
  'em elaboração': 'Em elaboração',
  'pendente': 'Pendente',
  'suspenso': 'Suspenso',
  'em revisao': 'Em Revisão',
  'em revisão': 'Em Revisão',
};

const VALID_COMERCIAL_STAGES = [
  'Prospecção',
  'Proposta',
  'Stand By',
  'Stand by',
  'Diagnóstico Preliminar',
  'Aceito',
  'Recusado',
  'No Go',
];

const ORDERED_PROPOSTAS_STATUS = [
  'Enviada',
  'Em elaboração',
  'Pendente',
  'Em revisão',
  'Cancelada',
  'Sem status',
];

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
        items_page(limit: 250) {
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

    if (data.errors) {
      return NextResponse.json({ error: data.errors[0]?.message || 'Erro Monday API' }, { status: 500 });
    }

    const boards = data?.data?.boards || [];
    const usersList = data?.data?.users || [];

    const usersMap = new Map<string, string>();
    usersList.forEach((u: any) => usersMap.set(String(u.id), u.name));

    const getBoard = (id: string) => boards.find((b: any) => b.id === id);

    // =========================================================================
    // 1. CARDS DO TOPO (10, 42, 18, 9)
    // =========================================================================
    const metrics = {
      projetosJornada: getBoard(BOARD_IDS.jornada)?.items_page?.items?.length ?? 0,
      contratos: getBoard(BOARD_IDS.contratos)?.items_page?.items?.length ?? 0,
      propostas: getBoard(BOARD_IDS.propostas)?.items_page?.items?.length ?? 0,
      standBy: getBoard(BOARD_IDS.standBy)?.items_page?.items?.length ?? 0,
    };

    // =========================================================================
    // 2. PIPELINE COMERCIAL POR FASE
    // =========================================================================
    const comercialBoard = getBoard(BOARD_IDS.comercial);
    const comercialItems = comercialBoard?.items_page?.items || [];
    const comercialMap: Record<string, number> = {};

    comercialItems.forEach((item: any) => {
      const statusCol = item.column_values?.find((c: any) => {
        if (!c.text) return false;
        return VALID_COMERCIAL_STAGES.some((s) => normalizeStr(s) === normalizeStr(c.text));
      });

      if (statusCol?.text) {
        const raw = statusCol.text.trim();
        const label = normalizeStr(raw) === 'stand by' ? 'Stand By' : raw;
        comercialMap[label] = (comercialMap[label] || 0) + 1;
      }
    });

    const pipelineComercial = Object.entries(comercialMap).map(([name, value]) => ({ name, value }));

    // =========================================================================
    // 3. PROJETOS POR FASE — JORNADA
    // =========================================================================
    const jornadaBoard = getBoard(BOARD_IDS.jornada);
    const jornadaItems = jornadaBoard?.items_page?.items || [];
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
    // 4. CONTRATOS POR STATUS
    // =========================================================================
    const contratosBoard = getBoard(BOARD_IDS.contratos);
    const contratosItems = contratosBoard?.items_page?.items || [];
    const contratosMap: Record<string, number> = {};

    contratosItems.forEach((item: any) => {
      const statusCol = item.column_values?.find((c: any) => {
        if (!c.text) return false;
        const norm = normalizeStr(c.text);
        return Object.prototype.hasOwnProperty.call(VALID_CONTRATOS_STATUS, norm);
      });

      if (statusCol?.text) {
        const officialName = VALID_CONTRATOS_STATUS[normalizeStr(statusCol.text)];
        if (officialName) {
          contratosMap[officialName] = (contratosMap[officialName] || 0) + 1;
        }
      }
    });

    const contratosStatus = Object.entries(contratosMap).map(([name, value]) => ({ name, value }));

    // =========================================================================
    // 5. CARGA POR RESPONSÁVEL — COMERCIAL
    // =========================================================================
    const countsMap: Record<string, number> = {};
    TEAM_ORDER.forEach((m) => { countsMap[m] = 0; });

    comercialItems.forEach((item: any) => {
      let combined = `${item.name || ''} ${item.group?.title || ''}`;

      item.column_values?.forEach((col: any) => {
        if (col.text) combined += ` ${col.text}`;
        if (col.value) {
          try {
            const parsed = JSON.parse(col.value);
            if (parsed.personsAndTeams) {
              parsed.personsAndTeams.forEach((p: any) => {
                const uName = usersMap.get(String(p.id));
                if (uName) combined += ` ${uName}`;
              });
            }
          } catch {}
        }
      });

      const normCombined = normalizeStr(combined);
      TEAM_ORDER.forEach((member) => {
        if (normCombined.includes(normalizeStr(member))) {
          countsMap[member] = (countsMap[member] || 0) + 1;
        }
      });
    });

    const cargaResponsavel = TEAM_ORDER.map((name) => ({
      name,
      value: countsMap[name] || 0,
    }));

    // =========================================================================
    // 6. PROPOSTAS — PROGRESSO (18 Propostas Totais - Mapeamento Fiel ao Monday)
    // =========================================================================
    const propostasBoard = getBoard(BOARD_IDS.propostas);
    const propostasItems = propostasBoard?.items_page?.items || [];
    const propostasMap: Record<string, number> = {
      'Enviada': 0,
      'Em elaboração': 0,
      'Pendente': 0,
      'Em revisão': 0,
      'Cancelada': 0,
      'Sem status': 0,
    };

    propostasItems.forEach((item: any) => {
      const statusCol = item.column_values?.find(
        (c: any) => (c.type === 'status' || c.type === 'color' || c.id === 'status' || c.id === 'progresso') && c.text
      );
      
      const raw = statusCol?.text?.trim();
      if (!raw) {
        propostasMap['Sem status'] = (propostasMap['Sem status'] || 0) + 1;
      } else {
        const norm = normalizeStr(raw);
        if (norm.includes('enviad')) propostasMap['Enviada']++;
        else if (norm.includes('elabora')) propostasMap['Em elaboração']++;
        else if (norm.includes('pendent')) propostasMap['Pendente']++;
        else if (norm.includes('revis')) propostasMap['Em revisão']++;
        else if (norm.includes('cancel')) propostasMap['Cancelada']++;
        else propostasMap['Sem status']++;
      }
    });

    // Retorna ordenado conforme o Monday (Enviada -> Em elaboração -> Pendente -> Em revisão -> Cancelada -> Sem status)
    const propostasProgresso = ORDERED_PROPOSTAS_STATUS
      .map((name) => ({ name, value: propostasMap[name] || 0 }))
      .filter((item) => item.value > 0);

    // =========================================================================
    // 7. TAREFAS EM ABERTO
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