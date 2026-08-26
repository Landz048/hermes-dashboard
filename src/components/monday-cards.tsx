"use client";

import { useEffect, useState, useRef } from "react";
import { FolderKanban, FileSignature, FileText, PauseCircle } from "lucide-react";

interface MondayMetrics {
  projetosJornada: number;
  contratos: number;
  propostas: number;
  standBy: number;
}

function useCountUp(target: number, duration = 1200) {
  const [val, setVal] = useState(0);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    if (target === 0) {
      setVal(0);
      return;
    }
    const start = Date.now();
    const tick = () => {
      const t = Math.min((Date.now() - start) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 4);
      setVal(Math.round(target * ease));
      if (t < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [target, duration]);

  return val;
}

function StatBox({
  title,
  count,
  icon: Icon,
  color,
}: {
  title: string;
  count: number;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  color: string;
}) {
  const displayCount = useCountUp(count);

  return (
    <div className="flex flex-col p-4 rounded-xl border border-[var(--hq-hairline)] bg-white/[0.02]">
      <div className="flex items-center justify-between">
        <span className="text-[12px] text-[var(--hq-text-dim)] font-medium">{title}</span>
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
      <span className="num text-[28px] font-semibold text-[var(--hq-text)] mt-3">
        {displayCount}
      </span>
    </div>
  );
}

export function MondayCards() {
  const [metrics, setMetrics] = useState<MondayMetrics>({
    projetosJornada: 0,
    contratos: 0,
    propostas: 0,
    standBy: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/monday")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d && !d.error) setMetrics(d);
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="panel flex flex-col p-6 h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FolderKanban className="w-4 h-4 text-[var(--accent)]" />
          <span className="eyebrow">Pipeline Monday</span>
        </div>
        {loading && <span className="text-[11px] text-[var(--hq-text-ghost)]">Atualizando...</span>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatBox
          title="Projetos na Jornada"
          count={metrics.projetosJornada}
          icon={FolderKanban}
          color="var(--accent)"
        />
        <StatBox
          title="Contratos no Board"
          count={metrics.contratos}
          icon={FileSignature}
          color="var(--hq-up)"
        />
        <StatBox
          title="Propostas no Board"
          count={metrics.propostas}
          icon={FileText}
          color="var(--hq-warn)"
        />
        <StatBox
          title="Clientes Stand By"
          count={metrics.standBy}
          icon={PauseCircle}
          color="var(--hq-text-ghost)"
        />
      </div>
    </div>
  );
}