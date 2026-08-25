"use client";

import { useEffect, useState } from "react";
import {
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  PlayCircle,
  ShieldCheck,
  X,
  ChevronRight,
  ChevronLeft,
  GripVertical,
} from "lucide-react";

interface Task {
  id: string;
  title: string;
  status: string;
  priority: number;
  assignee: string | null;
  result: string | null;
  board: string;
}

const COLUMNS = [
  { id: "todo", label: "TO DO", icon: Clock },
  { id: "approved", label: "APPROVED", icon: ShieldCheck },
  { id: "in_progress", label: "IN PROGRESS", icon: PlayCircle },
  { id: "done", label: "DONE", icon: CheckCircle2 },
];

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState("todo");
  const [priority, setPriority] = useState("1");
  const [assignee, setAssignee] = useState("Hermes");
  const [submitting, setSubmitting] = useState(false);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/tasks");
      const data = await res.json();
      if (data.tasks) setTasks(data.tasks);
    } catch (err) {
      console.error("Erro ao carregar tasks:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleUpdateStatus = async (taskId: string, newStatus: string) => {
    // Atualização otimista na tela
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );

    try {
      await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: taskId, status: newStatus }),
      });
    } catch (err) {
      console.error("Erro ao mover tarefa:", err);
      fetchTasks();
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      setSubmitting(true);
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          status,
          priority: Number(priority),
          assignee,
        }),
      });

      if (res.ok) {
        setTitle("");
        setIsModalOpen(false);
        fetchTasks();
      } else {
        alert("Erro ao criar tarefa");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (!window.confirm("Deseja realmente excluir esta tarefa?")) return;
    try {
      const res = await fetch(`/api/tasks?id=${id}`, { method: "DELETE" });
      if (res.ok) fetchTasks();
    } catch (err) {
      console.error(err);
    }
  };

  const getColumnTasks = (colId: string) => {
    return tasks.filter((t) => {
      const s = (t.status || "").toLowerCase().replace("-", "_").trim();
      if (colId === "todo") return s === "todo" || s === "backlog" || s === "to_do";
      if (colId === "approved") return s === "approved" || s === "aprovado";
      if (colId === "in_progress") return s === "in_progress" || s === "doing" || s === "progress";
      if (colId === "done") return s === "done" || s === "concluido" || s === "complete";
      return false;
    });
  };

  return (
    <div className="relative z-10 w-full mx-auto pb-16">
      <div className="pt-4 pb-8 flex items-center justify-between">
        <div>
          <span className="eyebrow text-xs text-zinc-500 uppercase tracking-wider block mb-1">
            Board de Operações
          </span>
          <h1 className="text-4xl font-semibold tracking-tight text-zinc-100">Tasks</h1>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-semibold rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Task
        </button>
      </div>

      {/* Grid de Colunas com Drag & Drop */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {COLUMNS.map((col, colIdx) => {
          const colTasks = getColumnTasks(col.id);
          const Icon = col.icon;
          return (
            <div
              key={col.id}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (draggedTaskId) {
                  handleUpdateStatus(draggedTaskId, col.id);
                  setDraggedTaskId(null);
                }
              }}
              className="rounded-xl border border-zinc-800/80 bg-zinc-950/50 p-4 flex flex-col min-h-[480px] transition-colors"
            >
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800/60 mb-3">
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-zinc-400" />
                  <span className="text-xs font-semibold tracking-wider text-zinc-300 uppercase">
                    {col.label}
                  </span>
                </div>
                <span className="text-xs num font-medium px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400">
                  {colTasks.length}
                </span>
              </div>

              <div className="space-y-2.5 flex-1 overflow-y-auto">
                {colTasks.length === 0 ? (
                  <div className="h-32 flex items-center justify-center border border-dashed border-zinc-800/60 rounded-lg">
                    <p className="text-xs text-zinc-600">Arraste um card aqui</p>
                  </div>
                ) : (
                  colTasks.map((t) => (
                    <div
                      key={t.id}
                      draggable
                      onDragStart={() => setDraggedTaskId(t.id)}
                      className="group rounded-lg border border-zinc-800 bg-zinc-900/80 p-3.5 hover:border-zinc-700 transition-all cursor-grab active:cursor-grabbing relative space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-1.5 min-w-0 flex-1">
                          <GripVertical className="w-3.5 h-3.5 text-zinc-600 mt-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                          <p className="text-xs font-medium text-zinc-200 leading-snug">
                            {t.title}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDeleteTask(t.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-zinc-500 hover:text-red-400 transition-all rounded shrink-0"
                          title="Excluir"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-2 border-t border-zinc-800/50">
                        <div className="flex items-center gap-2">
                          <span className="text-zinc-500 text-[10.5px]">
                            {t.assignee || "Hermes"}
                          </span>
                          <span className="num text-[10px] px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400">
                            P{t.priority}
                          </span>
                        </div>

                        {/* Botões de avançar/voltar coluna */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {colIdx > 0 && (
                            <button
                              onClick={() =>
                                handleUpdateStatus(t.id, COLUMNS[colIdx - 1].id)
                              }
                              className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
                              title="Mover para esquerda"
                            >
                              <ChevronLeft className="w-3 h-3" />
                            </button>
                          )}
                          {colIdx < COLUMNS.length - 1 && (
                            <button
                              onClick={() =>
                                handleUpdateStatus(t.id, COLUMNS[colIdx + 1].id)
                              }
                              className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
                              title="Mover para direita"
                            >
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Adicionar Task */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-zinc-100">Nova Tarefa</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-500 hover:text-zinc-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddTask} className="space-y-4">
              <div>
                <label className="block text-xs text-zinc-400 mb-1 font-medium">
                  Título da Tarefa
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Revisar proposta do cliente"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-zinc-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-zinc-400 mb-1 font-medium">
                    Status Inicial
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-zinc-700"
                  >
                    <option value="todo">TO DO</option>
                    <option value="approved">APPROVED</option>
                    <option value="in_progress">IN PROGRESS</option>
                    <option value="done">DONE</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-zinc-400 mb-1 font-medium">
                    Prioridade
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-zinc-700"
                  >
                    <option value="1">1 (Baixa)</option>
                    <option value="2">2 (Média)</option>
                    <option value="3">3 (Alta)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs text-zinc-400 mb-1 font-medium">
                  Responsável
                </label>
                <input
                  type="text"
                  value={assignee}
                  onChange={(e) => setAssignee(e.target.value)}
                  placeholder="Nome do responsável"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-zinc-700"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs text-zinc-400 hover:text-zinc-200 font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting || !title.trim()}
                  className="px-4 py-2 bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
                >
                  {submitting ? "Adicionando..." : "Salvar Tarefa"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}