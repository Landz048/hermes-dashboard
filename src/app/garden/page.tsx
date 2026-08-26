"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Play, Clock, CheckCircle2, PauseCircle, X } from "lucide-react";

interface CronItem {
  id: string;
  name: string;
  schedule: string;
  command: string;
  description?: string;
  enabled: boolean;
  lastRun?: string | null;
  createdAt: string;
}

export default function GardenPage() {
  const [crons, setCrons] = useState<CronItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [schedule, setSchedule] = useState("0 8 * * *");
  const [command, setCommand] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchCrons = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/garden");
      const data = await res.json();
      if (Array.isArray(data.crons)) {
        setCrons(data.crons);
      } else {
        setCrons([]);
      }
    } catch (err) {
      console.error("Erro ao buscar crons:", err);
      setCrons([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCrons();
  }, []);

  const handleAddCron = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !schedule || !command) return;

    try {
      setSubmitting(true);
      const res = await fetch("/api/garden", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, schedule, command, description }),
      });

      if (res.ok) {
        setName("");
        setCommand("");
        setDescription("");
        setIsModalOpen(false);
        fetchCrons();
      } else {
        alert("Erro ao salvar automação");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleEnable = async (id: string, currentStatus: boolean) => {
    try {
      await fetch("/api/garden", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, enabled: !currentStatus }),
      });
      fetchCrons();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteCron = async (id: string) => {
    if (!window.confirm("Deseja remover esta automação?")) return;
    try {
      await fetch(`/api/garden?id=${id}`, { method: "DELETE" });
      fetchCrons();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="relative z-10 w-full mx-auto pb-16">
      <div className="pt-4 pb-8 flex items-center justify-between">
        <div>
          <span className="eyebrow text-xs text-zinc-500 uppercase tracking-wider block mb-1">
            Hermes Garden
          </span>
          <h1 className="text-4xl font-semibold tracking-tight text-zinc-100">Automações & Crons</h1>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-semibold rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Novo Cron
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20 text-zinc-500 text-sm">Carregando automações...</div>
      ) : crons.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-800 p-12 text-center flex flex-col items-center justify-center space-y-3">
          <Clock className="w-8 h-8 text-zinc-600" />
          <p className="text-sm font-medium text-zinc-300">Nenhum cron cadastrado</p>
          <p className="text-xs text-zinc-500 max-w-sm">
            Adicione rotinas automáticas para briefing diário, sincronização de dados ou scripts periódicos.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/50 overflow-hidden">
          <table className="w-full text-left text-xs text-zinc-400">
            <thead className="bg-zinc-900/60 border-b border-zinc-800 text-zinc-300 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4 font-semibold">Nome / Descrição</th>
                <th className="py-3 px-4 font-semibold">Schedule (Cron)</th>
                <th className="py-3 px-4 font-semibold">Comando / Ação</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {crons.map((cron) => (
                <tr key={cron.id} className="hover:bg-zinc-900/30 transition-colors">
                  <td className="py-3.5 px-4">
                    <p className="font-semibold text-zinc-200">{cron.name}</p>
                    {cron.description && (
                      <p className="text-[11px] text-zinc-500">{cron.description}</p>
                    )}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-zinc-300">
                    <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800">
                      {cron.schedule}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-[11px] text-zinc-400 max-w-xs truncate">
                    {cron.command}
                  </td>
                  <td className="py-3.5 px-4">
                    <button
                      onClick={() => handleToggleEnable(cron.id, cron.enabled)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors ${
                        cron.enabled
                          ? "bg-emerald-950/40 text-emerald-400 border border-emerald-800/50"
                          : "bg-zinc-900 text-zinc-500 border border-zinc-800"
                      }`}
                    >
                      {cron.enabled ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" /> Ativo
                        </>
                      ) : (
                        <>
                          <PauseCircle className="w-3 h-3" /> Pausado
                        </>
                      )}
                    </button>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => handleDeleteCron(cron.id)}
                      className="p-1.5 text-zinc-500 hover:text-red-400 transition-colors rounded"
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Adicionar Cron */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-zinc-100">Nova Automação (Cron)</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-500 hover:text-zinc-300">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCron} className="space-y-4">
              <div>
                <label className="block text-xs text-zinc-400 mb-1 font-medium">Nome da Automação</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Briefing Diário"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-zinc-700"
                />
              </div>

              <div>
                <label className="block text-xs text-zinc-400 mb-1 font-medium">Expressão Cron</label>
                <input
                  type="text"
                  required
                  value={schedule}
                  onChange={(e) => setSchedule(e.target.value)}
                  placeholder="0 8 * * * (Todos os dias às 08h)"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm font-mono text-zinc-200 focus:outline-none focus:border-zinc-700"
                />
              </div>

              <div>
                <label className="block text-xs text-zinc-400 mb-1 font-medium">Comando / Instrução</label>
                <input
                  type="text"
                  required
                  value={command}
                  onChange={(e) => setCommand(e.target.value)}
                  placeholder="Ex: briefing.generate ou node sync.js"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm font-mono text-zinc-200 focus:outline-none focus:border-zinc-700"
                />
              </div>

              <div>
                <label className="block text-xs text-zinc-400 mb-1 font-medium">Descrição (Opcional)</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Gera o resumo matinal e salva no painel"
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
                  disabled={submitting || !name || !command}
                  className="px-4 py-2 bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
                >
                  {submitting ? "Salvando..." : "Salvar Automação"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}