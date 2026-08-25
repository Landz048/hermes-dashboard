"use client";

import { useState, useEffect } from "react";
import { Send, RefreshCw, CheckCircle2, Clock, AlertCircle } from "lucide-react";

interface RequestItem {
  id: string;
  kind: string;
  title: string;
  prompt: string | null;
  sideEffecting: boolean;
  status: string;
  result: string | null;
  createdAt: string;
}

export default function HermesPage() {
  const [prompt, setPrompt] = useState("");
  const [sideEffecting, setSideEffecting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRequests = async () => {
    try {
      setRefreshing(true);
      const res = await fetch("/api/hermes/requests");
      const data = await res.json();
      if (data.requests) setRequests(data.requests);
    } catch (err) {
      console.error(err);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    const interval = setInterval(fetchRequests, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/hermes/dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt.trim(),
          sideEffecting,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erro ao enviar dispatch");
      }

      setPrompt("");
      fetchRequests();
    } catch (err: any) {
      setErrorMsg(err.message || "Dispatch failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "done":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" /> Concluído
          </span>
        );
      case "running":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20 animate-pulse">
            <RefreshCw className="w-3 h-3 animate-spin" /> Em execução
          </span>
        );
      case "awaiting_approval":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
            <AlertCircle className="w-3 h-3" /> Aguardando aprovação
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-400 bg-zinc-800/50 px-2 py-0.5 rounded-full border border-zinc-700">
            <Clock className="w-3 h-3" /> Na fila
          </span>
        );
    }
  };

  return (
    <div className="relative z-10 w-full mx-auto pb-16">
      <div className="pt-4 pb-8 flex items-center justify-between">
        <div>
          <span className="eyebrow text-xs text-zinc-500 uppercase tracking-wider block mb-1">Agent Runtime</span>
          <h1 className="text-4xl font-semibold tracking-tight text-zinc-100">Hermes</h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-900/60 px-3 py-1 text-xs text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Online
          </div>
          <button
            onClick={fetchRequests}
            className="p-2 rounded-lg border border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-zinc-200 transition-colors"
            title="Atualizar lista"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      <form onSubmit={handleDispatch} className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4 shadow-sm">
        <div className="flex flex-col md:flex-row gap-3 items-center">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Digite uma instrução ou ordem para o agente..."
            className="flex-1 w-full bg-zinc-900/80 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-700"
          />

          <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
            <label className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={sideEffecting}
                onChange={(e) => setSideEffecting(e.target.checked)}
                className="rounded border-zinc-700 bg-zinc-900 text-emerald-500 focus:ring-0 focus:ring-offset-0"
              />
              side-effecting?
            </label>

            <button
              type="submit"
              disabled={loading || !prompt.trim()}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              {loading ? "Enviando..." : "Dispatch"}
            </button>
          </div>
        </div>

        {errorMsg && (
          <p className="text-xs text-red-400 mt-2 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" /> {errorMsg}
          </p>
        )}
      </form>

      <div className="mt-10">
        <div className="mb-4">
          <span className="eyebrow text-xs text-zinc-500 uppercase tracking-wider block">DISPATCHES</span>
          <h2 className="text-lg font-medium text-zinc-200">What you've sent Hermes</h2>
        </div>

        {requests.length === 0 ? (
          <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/40 p-12 text-center">
            <Send className="w-6 h-6 text-zinc-600 mx-auto mb-2 opacity-60" />
            <p className="text-sm font-medium text-zinc-300">No dispatches yet</p>
            <p className="text-xs text-zinc-500 mt-1">Envie uma tarefa na barra acima para acompanhar o status e o resultado aqui.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map((item) => (
              <div key={item.id} className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4 space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm font-semibold text-zinc-200 truncate">{item.title}</span>
                    {item.sideEffecting && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        side-effect
                      </span>
                    )}
                  </div>
                  <div className="shrink-0">{renderStatusBadge(item.status)}</div>
                </div>

                {item.prompt && item.prompt !== item.title && (
                  <p className="text-xs text-zinc-400 bg-zinc-900/40 p-2.5 rounded-lg font-mono">{item.prompt}</p>
                )}

                {item.result && (
                  <div className="mt-2 border-t border-zinc-800/80 pt-2 text-xs text-zinc-300">
                    <span className="text-[11px] font-semibold text-zinc-500 block mb-1">Resultado:</span>
                    <div className="whitespace-pre-wrap bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-800/60 font-sans">
                      {item.result}
                    </div>
                  </div>
                )}

                <div className="text-[10px] text-zinc-500 pt-1">
                  {new Date(item.createdAt).toLocaleString("pt-BR")}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}