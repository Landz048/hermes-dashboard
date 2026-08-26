"use client";

import { useEffect, useState } from "react";
import {
  Play,
  Clock,
  CheckCircle2,
  RefreshCw,
  Terminal,
  Layers,
  FileText,
  Trash,
  ShieldCheck,
} from "lucide-react";

interface CronItem {
  id: string;
  name: string;
  schedule: string;
  command: string;
  description?: string;
  enabled: boolean;
  type?: string;
}

// Mapeamento de descrições e nomes amigáveis para os crons da VPS
const CRON_METADATA: Record<string, { name: string; description: string; icon: any }> = {
  "briefing.generate": {
    name: "Briefing Matinal Executivo",
    description: "Analisa a wiki (~/.hermes/wiki) e tarefas ativas para compor o resumo do dia.",
    icon: Layers,
  },
  "ingest_docs.py": {
    name: "Ingestão & Vetorização de Documentos",
    description: "Varre diretórios de arquivos e atualiza a base de conhecimento vetorial do agente.",
    icon: FileText,
  },
  "sync_drive": {
    name: "Limpeza de Logs e Sincronização",
    description: "Executa a rotação de logs antigos e limpa arquivos temporários do servidor.",
    icon: Trash,
  },
  "hermes-bridge": {
    name: "Monitoramento do Hermes Bridge",
    description: "Healthcheck periódico para garantir que a ponte de comunicação esteja online.",
    icon: ShieldCheck,
  },
};

export default function GardenPage() {
  const [crons, setCrons] = useState<CronItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [runningId, setRunningId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

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
      console.error("Erro ao carregar crons:", err);
      setCrons([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCrons();
  }, []);

  const getCronDetails = (cron: CronItem) => {
    if (cron.command.includes("briefing.generate")) return CRON_METADATA["briefing.generate"];
    if (cron.command.includes("ingest_docs")) return CRON_METADATA["ingest_docs.py"];
    if (cron.command.includes("logs") || cron.command.includes("find")) return CRON_METADATA["sync_drive"];
    if (cron.command.includes("hermes-bridge")) return CRON_METADATA["hermes-bridge"];

    return {
      name: cron.name || "Rotina de Sistema",
      description: cron.description || "Comando agendado no crontab do Linux.",
      icon: Terminal,
    };
  };

  const handleRunNow = async (cron: CronItem) => {
    try {
      setRunningId(cron.id);
      const res = await fetch("/api/garden", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: cron.command, name: cron.name }),
      });

      if (res.ok) {
        setFeedback(`Ordem enviada para a VPS: "${cron.name}"`);
        setTimeout(() => setFeedback(null), 4500);
      } else {
        alert("Falha ao enviar comando para a VPS.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRunningId(null);
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
          onClick={fetchCrons}
          className="inline-flex items-center gap-2 px-3 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-medium rounded-lg border border-zinc-800 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Sincronizar VPS
        </button>
      </div>

      {feedback && (
        <div className="mb-4 p-3 bg-emerald-950/40 border border-emerald-800/50 rounded-lg text-xs text-emerald-400 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          {feedback}
        </div>
      )}

      {loading && crons.length === 0 ? (
        <div className="text-center py-20 text-zinc-500 text-sm">Carregando rotinas da VPS...</div>
      ) : crons.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-800 p-12 text-center flex flex-col items-center justify-center space-y-3">
          <Clock className="w-8 h-8 text-zinc-600" />
          <p className="text-sm font-medium text-zinc-300">Nenhum cron ativo</p>
        </div>
      ) : (
        <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/50 overflow-hidden">
          <table className="w-full text-left text-xs text-zinc-400">
            <thead className="bg-zinc-900/60 border-b border-zinc-800 text-zinc-300 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4 font-semibold">Nome & Descrição</th>
                <th className="py-3 px-4 font-semibold">Frequência (Cron)</th>
                <th className="py-3 px-4 font-semibold">Comando do Servidor</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Executar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {crons.map((cron) => {
                const meta = getCronDetails(cron);
                const IconComponent = meta.icon;
                return (
                  <tr key={cron.id} className="hover:bg-zinc-900/30 transition-colors">
                    <td className="py-3.5 px-4 max-w-sm">
                      <div className="flex items-start gap-2.5">
                        <div className="p-1.5 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-300 mt-0.5 shrink-0">
                          <IconComponent className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-semibold text-zinc-200 text-xs">{meta.name}</p>
                          <p className="text-[11.5px] text-zinc-500 leading-snug mt-0.5">
                            {meta.description}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-zinc-300">
                      <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[11px]">
                        {cron.schedule}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[11px] text-zinc-500 max-w-[220px] truncate" title={cron.command}>
                      {cron.command}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-950/40 text-emerald-400 border border-emerald-800/50">
                        <CheckCircle2 className="w-3 h-3" /> Ativo
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleRunNow(cron)}
                        disabled={runningId === cron.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 hover:bg-white text-zinc-950 font-semibold rounded-lg text-xs transition-colors disabled:opacity-50"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        {runningId === cron.id ? "Executando..." : "Run Now"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}