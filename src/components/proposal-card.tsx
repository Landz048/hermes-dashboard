"use client";

import { useEffect, useState } from "react";
import { FileText, Users, Clock } from "lucide-react";

interface ProposalData {
  total: number;
  clientsCount: number;
  byClient: Record<string, number>;
  recent: Array<{ fileName: string; client: string; updatedAt: string }>;
  syncedAt?: string;
}

export function ProposalsCard() {
  const [data, setData] = useState<ProposalData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = () => {
      fetch("/api/hermes/proposals")
        .then((res) => res.json())
        .then((res) => {
          setData(res);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    };

    loadData();
    // Atualiza automaticamente a cada 1 hora (3.600.000 ms)
    const interval = setInterval(loadData, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-5 shadow-sm">
      <div className="flex items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-zinc-200">Propostas Criadas</h3>
            <p className="text-xs text-zinc-500">Mapeadas nos diretórios dos clientes</p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-2xl font-bold text-zinc-100">
            {loading ? "..." : data?.total ?? 0}
          </span>
          <span className="block text-[11px] text-zinc-500">arquivos</span>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 border-t border-zinc-800/80 pt-3">
        <div className="flex items-center gap-2 rounded-lg bg-zinc-900/50 p-2">
          <Users className="h-4 w-4 text-zinc-400" />
          <div>
            <p className="text-[11px] text-zinc-500">Clientes c/ proposta</p>
            <p className="text-xs font-semibold text-zinc-200">
              {loading ? "..." : data?.clientsCount ?? 0}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-zinc-900/50 p-2">
          <Clock className="h-4 w-4 text-zinc-400" />
          <div>
            <p className="text-[11px] text-zinc-500">Última sinc</p>
            <p className="text-xs font-semibold text-zinc-200">
              {data?.syncedAt ? new Date(data.syncedAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "Ativa"}
            </p>
          </div>
        </div>
      </div>

      {data?.recent && data.recent.length > 0 && (
        <div className="mt-3 space-y-1.5 border-t border-zinc-800/80 pt-3">
          <p className="text-[11px] font-medium text-zinc-400">Recentes:</p>
          {data.recent.slice(0, 2).map((item, idx) => (
            <div key={idx} className="flex items-center justify-between text-xs text-zinc-400">
              <span className="truncate max-w-[180px] font-medium text-zinc-300">{item.client}</span>
              <span className="truncate max-w-[120px] text-[11px] text-zinc-500">{item.fileName}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}