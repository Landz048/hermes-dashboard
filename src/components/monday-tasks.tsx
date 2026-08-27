"use client";

import { useEffect, useState } from "react";
import { CheckSquare, ChevronDown, MessageSquare, Filter, Layers } from "lucide-react";

interface MondayTaskItem {
  id: string;
  name: string;
  group: string;
  groupColor: string;
  board: string;
}

export default function MondayTasksTable() {
  const [tasks, setTasks] = useState<MondayTaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetch("/api/monday")
      .then((r) => (r.ok ? r.json() : null))
      .then((res) => {
        if (res && res.tarefasEmAberto) {
          setTasks(res.tarefasEmAberto);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  // Agrupa tarefas pelo nome do Quadro ou Grupo
  const groupedTasks = tasks.reduce((acc, t) => {
    const key = t.board || "Outros";
    if (!acc[key]) acc[key] = [];
    acc[key].push(t);
    return acc;
  }, {} as Record<string, MondayTaskItem[]>);

  const toggleGroup = (groupName: string) => {
    setCollapsedGroups((prev) => ({ ...prev, [groupName]: !prev[groupName] }));
  };

  return (
    <div className="panel flex flex-col p-6 w-full">
      {/* Header do Widget */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[var(--hq-hairline)]">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-[var(--accent)]" />
            <h2 className="text-[16px] font-semibold text-[var(--hq-text)]">Tarefas em Aberto</h2>
          </div>
          <span className="num text-[11px] px-2 py-0.5 rounded-full bg-white/[0.04] text-[var(--hq-text-ghost)] border border-[var(--hq-hairline)]">
            {tasks.length} elementos
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium text-[var(--hq-text-dim)] hover:text-[var(--hq-text)] bg-white/[0.02] hover:bg-white/[0.05] border border-[var(--hq-hairline)] rounded-lg transition-colors">
            <Filter className="w-3 h-3" />
            Filtro
          </button>
          <button className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium text-[var(--hq-text-dim)] hover:text-[var(--hq-text)] bg-white/[0.02] hover:bg-white/[0.05] border border-[var(--hq-hairline)] rounded-lg transition-colors">
            <Layers className="w-3 h-3" />
            Agrupar
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-[12px] text-[var(--hq-text-ghost)]">
          Carregando tarefas do Monday...
        </div>
      ) : tasks.length === 0 ? (
        <div className="py-12 text-center text-[12px] text-[var(--hq-text-ghost)]">
          Nenhuma tarefa encontrada.
        </div>
      ) : (
        <div className="space-y-6 mt-4">
          {Object.entries(groupedTasks).map(([boardName, items]) => {
            const isCollapsed = collapsedGroups[boardName];

            return (
              <div key={boardName} className="flex flex-col border border-[var(--hq-hairline)] rounded-xl overflow-hidden bg-black/20">
                {/* Cabeçalho do Grupo */}
                <button
                  onClick={() => toggleGroup(boardName)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.02] hover:bg-white/[0.04] border-b border-[var(--hq-hairline)] transition-colors text-left"
                >
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-[var(--hq-text-ghost)] transition-transform duration-200 ${
                      isCollapsed ? "-rotate-90" : ""
                    }`}
                  />
                  <span className="text-[13px] font-semibold text-[var(--hq-text)]">{boardName}</span>
                  <span className="num text-[11px] text-[var(--hq-text-ghost)] ml-1">({items.length})</span>
                </button>

                {/* Tabela de Itens */}
                {!isCollapsed && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-[var(--hq-hairline)] text-[11px] text-[var(--hq-text-ghost)] bg-white/[0.01]">
                          <th className="py-2.5 px-4 w-10 text-center font-normal">
                            <input type="checkbox" disabled className="rounded border-zinc-700 bg-zinc-900 opacity-40 cursor-default" />
                          </th>
                          <th className="py-2.5 px-4 font-normal">Elemento</th>
                          <th className="py-2.5 px-4 font-normal w-40">Grupo</th>
                          <th className="py-2.5 px-4 font-normal w-40">Quadro</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--hq-hairline)] text-[12px]">
                        {items.map((task) => (
                          <tr key={task.id} className="hover:bg-white/[0.02] transition-colors group">
                            <td className="py-2.5 px-4 text-center">
                              <input
                                type="checkbox"
                                className="rounded border-zinc-700 bg-zinc-900 text-[var(--accent)] focus:ring-0 cursor-pointer"
                              />
                            </td>
                            <td className="py-2.5 px-4">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-[var(--hq-text)] font-medium truncate">{task.name}</span>
                                <MessageSquare className="w-3.5 h-3.5 text-[var(--hq-text-ghost)] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                              </div>
                            </td>
                            <td className="py-2.5 px-4">
                              <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: task.groupColor }} />
                                <span className="text-[var(--hq-text-dim)] truncate">{task.group}</span>
                              </div>
                            </td>
                            <td className="py-2.5 px-4 text-[var(--hq-text-ghost)] truncate">
                              {task.board}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}