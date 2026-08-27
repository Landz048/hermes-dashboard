"use client";

import { useEffect, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
} from "recharts";
import { PieChart as PieIcon, BarChart3, UserCheck, Activity, Layers } from "lucide-react";

const PALETTE = [
  "#f59e0b", // Âmbar
  "#0ea5e9", // Azul Céu
  "#10b981", // Esmeralda
  "#64748b", // Cinza Ardósia
  "#3b82f6", // Azul Cobalto
  "#ec4899", // Rosa
  "#8b5cf6", // Roxo
  "#ef4444", // Vermelho
];

// Paleta oficial correspondente às fases de Propostas no Monday
const PROPOSTAS_COLORS: Record<string, string> = {
  "Enviada": "#3b82f6",        // Azul Monday
  "Em elaboração": "#f97316",  // Laranja
  "Pendente": "#eab308",       // Amarelo
  "Em revisão": "#0284c7",     // Azul Petróleo
  "Cancelada": "#52525b",      // Grafite
  "Sem status": "#a1a1aa",     // Cinza Claro (empty)
};

const TOOLTIP_STYLES = {
  contentStyle: {
    backgroundColor: "#18181b",
    border: "1px solid rgba(255, 255, 255, 0.15)",
    borderRadius: "8px",
    padding: "8px 12px",
    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.5)",
  },
  itemStyle: {
    color: "#ffffff",
    fontSize: "12px",
    fontWeight: 500,
  },
  labelStyle: {
    color: "#d4d4d8",
    fontSize: "11px",
    marginBottom: "4px",
  },
};

// Renderizador customizado do Eixo X com quebra de linha e alto contraste
function CustomAxisTick({ x, y, payload }: any) {
  const words = (payload.value || "").split(" ");
  const line1 = words.slice(0, Math.ceil(words.length / 2)).join(" ");
  const line2 = words.slice(Math.ceil(words.length / 2)).join(" ");

  return (
    <g transform={`translate(${x},${y})`}>
      <text x={0} y={0} dy={12} textAnchor="middle" fill="#d4d4d8" fontSize={11} fontWeight={500}>
        <tspan x={0} dy="0.71em">{line1}</tspan>
        {line2 && <tspan x={0} dy="1.15em">{line2}</tspan>}
      </text>
    </g>
  );
}

export default function MondayCharts() {
  const [data, setData] = useState<{
    pipelineComercial: { name: string; value: number }[];
    projetosJornadaFases: { name: string; value: number }[];
    contratosStatus: { name: string; value: number }[];
    cargaResponsavel: { name: string; value: number }[];
    propostasProgresso: { name: string; value: number }[];
  }>({
    pipelineComercial: [],
    projetosJornadaFases: [],
    contratosStatus: [],
    cargaResponsavel: [],
    propostasProgresso: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = () => {
      fetch("/api/monday")
        .then((r) => (r.ok ? r.json() : null))
        .then((res) => {
          if (res && !res.error) {
            setData({
              pipelineComercial: res.pipelineComercial || [],
              projetosJornadaFases: res.projetosJornadaFases || [],
              contratosStatus: res.contratosStatus || [],
              cargaResponsavel: res.cargaResponsavel || [],
              propostasProgresso: res.propostasProgresso || [],
            });
          }
        })
        .finally(() => setLoading(false));
    };

    fetchData();
    const interval = setInterval(fetchData, 60_000); // ⏱️ Atualiza automaticamente a cada 60s
    return () => clearInterval(interval);
  }, []);

  const totalPropostas = data.propostasProgresso.reduce((acc, it) => acc + it.value, 0);

  return (
    <div className="space-y-5 mt-5">
      {/* ── LINHA 1: Pipeline Comercial & Projetos por Fase ───────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* 1. Pipeline Comercial por Fase */}
        <div className="panel flex flex-col p-6 h-[340px]">
          <div className="flex items-center gap-2 mb-2">
            <PieIcon className="w-4 h-4 text-amber-400" />
            <span className="eyebrow">Pipeline Comercial por Fase</span>
          </div>

          {loading ? (
            <div className="flex-1 flex items-center justify-center text-[12px] text-[#a1a1aa]">Carregando...</div>
          ) : (
            <div className="flex-1 w-full flex items-center">
              <div className="w-1/2 h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip {...TOOLTIP_STYLES} />
                    <Pie data={data.pipelineComercial} innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value">
                      {data.pipelineComercial.map((_, i) => (
                        <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-1/2 flex flex-col gap-1.5 overflow-y-auto max-h-[220px] pr-2">
                {data.pipelineComercial.map((entry, idx) => (
                  <div key={idx} className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-2 truncate">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: PALETTE[idx % PALETTE.length] }} />
                      <span className="text-[#d4d4d8] font-medium truncate">{entry.name}</span>
                    </div>
                    <span className="num font-semibold text-white ml-2">{entry.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 2. Projetos por Fase — Jornada */}
        <div className="panel flex flex-col p-6 h-[340px]">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-4 h-4 text-sky-400" />
            <span className="eyebrow">Projetos por Fase — Jornada</span>
          </div>

          {loading ? (
            <div className="flex-1 flex items-center justify-center text-[12px] text-[#a1a1aa]">Carregando...</div>
          ) : (
            <div className="flex-1 w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.projetosJornadaFases} margin={{ top: 15, right: 10, left: -20, bottom: 45 }}>
                  <XAxis
                    dataKey="name"
                    tick={<CustomAxisTick />}
                    interval={0}
                    tickLine={{ stroke: "#71717a" }}
                    axisLine={{ stroke: "#52525b" }}
                  />
                  <YAxis
                    stroke="#a1a1aa"
                    fontSize={11}
                    fontWeight={500}
                    tickLine={{ stroke: "#71717a" }}
                    axisLine={{ stroke: "#52525b" }}
                  />
                  <Tooltip {...TOOLTIP_STYLES} />
                  <Bar dataKey="value" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* ── LINHA 2: Contratos por Status & Carga por Responsável ──────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* 3. Contratos por Status */}
        <div className="panel flex flex-col p-6 h-[340px]">
          <div className="flex items-center gap-2 mb-2">
            <Layers className="w-4 h-4 text-emerald-400" />
            <span className="eyebrow">Contratos por Status</span>
          </div>

          {loading ? (
            <div className="flex-1 flex items-center justify-center text-[12px] text-[#a1a1aa]">Carregando...</div>
          ) : (
            <div className="flex-1 w-full flex items-center">
              <div className="w-1/2 h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip {...TOOLTIP_STYLES} />
                    <Pie data={data.contratosStatus} innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value">
                      {data.contratosStatus.map((_, i) => (
                        <Cell key={i} fill={PALETTE[(i + 2) % PALETTE.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-1/2 flex flex-col gap-1.5 overflow-y-auto max-h-[220px] pr-2">
                {data.contratosStatus.map((entry, idx) => (
                  <div key={idx} className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-2 truncate">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: PALETTE[(idx + 2) % PALETTE.length] }} />
                      <span className="text-[#d4d4d8] font-medium truncate">{entry.name}</span>
                    </div>
                    <span className="num font-semibold text-white ml-2">{entry.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 4. Carga por Responsável — Comercial */}
        <div className="panel flex flex-col p-6 min-h-[340px] h-full">
          <div className="flex items-center gap-2 mb-2">
            <UserCheck className="w-4 h-4 text-purple-400" />
            <span className="eyebrow">Carga por Responsável — Comercial</span>
          </div>

          {loading ? (
            <div className="flex-1 flex items-center justify-center text-[12px] text-[#a1a1aa]">Carregando...</div>
          ) : (
            <div className="flex-1 w-full mt-2 h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.cargaResponsavel}
                  layout="vertical"
                  margin={{ top: 10, right: 25, left: 15, bottom: 10 }}
                >
                  <XAxis
                    type="number"
                    allowDecimals={false}
                    stroke="#a1a1aa"
                    fontSize={11}
                    fontWeight={500}
                    tickLine={{ stroke: "#71717a" }}
                    axisLine={{ stroke: "#52525b" }}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    stroke="#f4f4f5"
                    fontSize={12}
                    fontWeight={600}
                    tickLine={false}
                    axisLine={false}
                    width={70}
                  />
                  <Tooltip {...TOOLTIP_STYLES} />
                  <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={18} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* ── LINHA 3: Propostas — Progresso ───────────────────────────────── */}
      <div className="panel flex flex-col p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-400" />
            <span className="eyebrow">Propostas — Progresso</span>
          </div>
          <span className="num text-[12px] text-[#a1a1aa]">{totalPropostas} propostas totais</span>
        </div>

        {loading ? (
          <div className="py-6 text-center text-[12px] text-[#a1a1aa]">Carregando...</div>
        ) : (
          <div className="space-y-4">
            {/* Barra Segmentada de Progresso com Porcentagens em Todas as Fatias */}
            <div className="h-7 w-full rounded-lg bg-white/[0.04] overflow-hidden flex border border-white/5">
              {data.propostasProgresso.map((item, idx) => {
                const pct = totalPropostas > 0 ? (item.value / totalPropostas) * 100 : 0;
                if (pct === 0) return null;
                const barColor = PROPOSTAS_COLORS[item.name] || PALETTE[idx % PALETTE.length];
                return (
                  <div
                    key={idx}
                    title={`${pct.toFixed(1)}% ${item.name} (${item.value})`}
                    style={{
                      width: `${pct}%`,
                      background: barColor,
                    }}
                    className="h-full transition-all hover:opacity-90 cursor-pointer flex items-center justify-center relative min-w-0"
                  >
                    <span className="text-[10px] sm:text-[11px] font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] truncate px-0.5 select-none">
                      {pct >= 5 ? `${pct.toFixed(1)}%` : `${pct.toFixed(0)}%`}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Legenda com Cores Oficiais e % */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              {data.propostasProgresso.map((item, idx) => {
                const pct = totalPropostas > 0 ? ((item.value / totalPropostas) * 100).toFixed(1) : "0";
                const dotColor = PROPOSTAS_COLORS[item.name] || PALETTE[idx % PALETTE.length];
                return (
                  <div key={idx} className="flex items-center gap-1.5 text-[11px]">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: dotColor }} />
                    <span className="text-[#d4d4d8] font-medium">{item.name}:</span>
                    <span className="num font-semibold text-white">{item.value}</span>
                    <span className="text-[#71717a] text-[10px]">({pct}%)</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}