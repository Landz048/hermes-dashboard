"use client";

import { useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";
import { HermesBriefing } from "@/components/hermes-briefing";
import { ApprovalInbox } from "@/components/approval-inbox";
import { ProposalsCard } from "@/components/proposal-card";
import { MondayCards } from "@/components/monday-cards";

const MondayCharts = dynamic(
  () => import("@/components/monday-charts"),
  { ssr: false }
);

const MondayTasksTable = dynamic(
  () => import("@/components/monday-tasks"),
  { ssr: false }
);

// ── Types ─────────────────────────────────────────────────
interface Process { name: string; status: string; uptime: string }
interface ScoreComponent { score: number; weight?: number; label: string; detail?: string }
interface ScoreData { score: number; grade: string; label: string; color: string; period?: string; components: Record<string, ScoreComponent> }

interface HomeData {
  processes: Process[];
}

const EMPTY: HomeData = {
  processes: [],
};

// ── Animated counter ──────────────────────────────────────
function useCountUp(target: number, duration = 1400, enabled = true) {
  const [val, setVal] = useState(0);
  const raf = useRef<number | null>(null);
  useEffect(() => {
    const reduce = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (!enabled || target === 0 || reduce) { setVal(target); return; }
    const start = Date.now();
    const tick = () => {
      const t = Math.min((Date.now() - start) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 4);
      setVal(Math.round(target * ease));
      if (t < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [target, duration, enabled]);
  return val;
}

// ── Helpers ───────────────────────────────────────────────
function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

// ── Section header ────────────────────────────────────────
function SectionLabel({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <span className="eyebrow">{children}</span>
      <span className="h-px flex-1 bg-[var(--hq-hairline)]" />
      {right}
    </div>
  );
}

// ── Agents strip ──────────────────────────────────────────
function AgentsStrip({ processes }: { processes: Process[] }) {
  if (processes.length === 0) return null;
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="eyebrow mr-1">Serviços Ativos</span>
      {processes.map((p, i) => (
        <div key={i} className="flex items-center gap-1.5 rounded-lg border border-[var(--hq-hairline)] bg-white/[0.02] px-2.5 py-1.5">
          <span className="relative flex w-1.5 h-1.5">
            {p.status === "online" && <span className="absolute inline-flex h-full w-full rounded-full animate-ping" style={{ background: "color-mix(in srgb, var(--up) 60%, transparent)" }} />}
            <span className="relative inline-flex w-1.5 h-1.5 rounded-full" style={{ background: p.status === "online" ? "var(--up)" : "var(--down)" }} />
          </span>
          <span className="text-[var(--hq-text-dim)] text-[12px]">{p.name}</span>
          <span className="num text-[var(--hq-text-ghost)] text-[10px]">{p.uptime}</span>
        </div>
      ))}
    </div>
  );
}

// ── Momentum Score gauge ──────────────────────────────────
function ScoreGauge({ score }: { score: ScoreData }) {
  const tier = score.score >= 80 ? "var(--hq-up)" : score.score >= 60 ? "var(--hq-warn)" : "var(--hq-down)";
  const counted = useCountUp(score.score, 1400, true);
  const R = 50, C = 2 * Math.PI * R;
  const pct = Math.min(100, Math.max(0, counted));
  const comps = Object.entries(score.components || {}).slice(0, 4);
  return (
    <div className="flex items-center gap-5">
      <div className="relative w-[112px] h-[112px] shrink-0">
        <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
          <circle cx="60" cy="60" r="50" fill="none" stroke="var(--hq-hairline)" strokeWidth="6" />
          <circle cx="60" cy="60" r="50" fill="none" stroke={tier} strokeWidth="6" strokeLinecap="round"
            strokeDasharray={`${(C * pct) / 100} ${C}`} style={{ transition: "stroke-dasharray 0.5s var(--ease)" }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="num font-semibold text-[32px] leading-none tracking-[-0.02em]" style={{ color: tier }}>{Math.round(counted)}</span>
          <span className="num text-[10.5px] text-[var(--hq-text-ghost)] mt-1">{score.grade}</span>
        </div>
      </div>
      <div className="hidden sm:block w-[176px]">
        <div className="eyebrow !text-[9.5px]">Performance</div>
        <div className="text-[14px] font-semibold mt-0.5 mb-2.5" style={{ color: tier }}>{score.label}</div>
        <div className="space-y-[7px]">
          {comps.map(([k, c]) => {
            const cc = c.score >= 80 ? "var(--hq-up)" : c.score >= 40 ? "var(--hq-warn)" : "var(--hq-down)";
            return (
              <div key={k} className="flex items-center gap-2">
                <span className="num text-[9.5px] text-[var(--hq-text-ghost)] w-14 truncate">{c.label.split(" ")[0]}</span>
                <div className="h-[3px] flex-1 rounded-full bg-white/[0.06] overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${c.score}%`, background: cc, opacity: 0.85, transition: "width 1s var(--ease)" }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────
export default function Dashboard() {
  const [data, setData] = useState<HomeData>(EMPTY);
  const [time, setTime] = useState(new Date());
  const [mounted, setMounted] = useState(false);
  const [score, setScore] = useState<ScoreData | null>(null);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    fetch("/api/score").then(r => r.ok ? r.json() : null).then(d => { if (d) setScore(d); }).catch(() => {});
  }, []);
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    fetch("/api/home")
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) { setData(d); } })
      .catch(() => {});
    const iv = setInterval(() => {
      fetch("/api/home").then(r => r.ok ? r.json() : null).then(d => { if (d) setData(d); }).catch(() => {});
    }, 60_000);
    return () => clearInterval(iv);
  }, []);

  if (!mounted) return null;

  const rise = (i: number) => ({ animationDelay: `${i * 60}ms` });

  return (
    <div className="relative z-10 w-full mx-auto pb-16">

      {/* ── Header ─────────────────────────────────────── */}
      <div className="hq-rise pt-4 pb-8 flex flex-wrap items-end justify-between gap-6" style={rise(0)}>
        <div>
          <div className="eyebrow mb-2.5">{greeting()}</div>
          <h1 className="text-[40px] font-semibold tracking-[-0.025em] leading-none text-[var(--hq-text)]">
            {process.env.NEXT_PUBLIC_OWNER_NAME || "Hermy HQ"}
          </h1>
          <p className="num text-[var(--hq-text-ghost)] text-[12.5px] mt-3">
            {time.toLocaleDateString("pt-BR", { weekday: "long", month: "long", day: "numeric" })}
            {"  ·  "}
            {time.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })}
          </p>
        </div>
        <div className="flex flex-col items-end gap-4">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5 rounded-full border border-[var(--hq-hairline)] bg-white/[0.02] px-2.5 py-1">
              <span className="relative flex w-1.5 h-1.5">
                <span className="absolute inline-flex h-full w-full rounded-full animate-ping" style={{ background: "color-mix(in srgb, var(--up) 60%, transparent)" }} />
                <span className="relative inline-flex w-1.5 h-1.5 rounded-full" style={{ background: "var(--up)" }} />
              </span>
              <span className="eyebrow !text-[9.5px] !text-[var(--hq-text-faint)]">Online</span>
            </div>
          </div>
          {score && <ScoreGauge score={score} />}
        </div>
      </div>

      {/* ── Métricas Comerciais (Topo) ─────────────────── */}
      <div className="mb-8">
        <SectionLabel>Métricas Comerciais</SectionLabel>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="hq-rise lg:col-span-1" style={rise(1)}>
            <ProposalsCard />
          </div>
          <div className="hq-rise lg:col-span-2" style={rise(2)}>
            <MondayCards />
          </div>
        </div>
        
        {/* Gráficos do Monday */}
        <div className="hq-rise" style={rise(3)}>
          <MondayCharts />
        </div>
      </div>

      {/* ── Brief + Approval inbox ─────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 items-start">
        <div className="xl:col-span-2 hq-rise" style={rise(4)}>
          <HermesBriefing />
        </div>
        <div className="xl:col-span-1 hq-rise" style={rise(5)}>
          <ApprovalInbox compact />
        </div>
      </div>

      {/* ── Operação & Execução (Tarefas em Aberto Monday) */}
      <div className="mt-10">
        <SectionLabel>Operação & Execução</SectionLabel>
        <div className="hq-rise" style={rise(6)}>
          <MondayTasksTable />
        </div>
      </div>

      {/* ── Status dos Agentes e Processos ──────────────── */}
      <div className="mt-14">
        <AgentsStrip processes={data.processes} />
      </div>
    </div>
  );
}