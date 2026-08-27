"use client";

import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis } from "recharts";
import { PieChart as PieIcon, BarChart3 } from "lucide-react";

const COLORS = [
  "#f59e0b", // Amber / Prospecção
  "#0ea5e9", // Sky / Proposta
  "#64748b", // Slate / Stand By
  "#3b82f6", // Blue / Diagnóstico
  "#10b981", // Emerald / Aceito
  "#ef4444", // Rose / Recusado
  "#8b5cf6", // Purple / No Go
];

export function MondayCharts() {
  const [data, setData] = useState<{
    pipelineComercial: { name: string; value: number }[];
    projetosJornadaFases: { name: string; value: number }[];
  }>({
    pipelineComercial: [],
    projetosJornadaFases: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/monday")
      .then((r) => (r.ok ? r.json() : null))
      .then((res) => {
        if (res && !res.error) {
          setData({
            pipelineComercial: res.pipelineComercial || [],
            projetosJornadaFases: res.projetosJornadaFases || [],
          });
        }
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-5">
      {/* Gráfico 1: Pipeline Comercial por Fase */}
      <div className="panel flex flex-col p-6 h-[340px]">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <PieIcon className="w-4 h-4 text-amber-400" />
            <span className="eyebrow">Pipeline Comercial por Fase</span>
          </div>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center text-[12px] text-[var(--hq-text-ghost)]">
            Carregando gráfico...
          </div>
        ) : (
          <div className="flex-1 w-full flex items-center">
            <div className="w-1/2 h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip
                    contentStyle={{
                      background: "#18181b",
                      border: "1px solid var(--hq-hairline)",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Pie
                    data={data.pipelineComercial}
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {data.pipelineComercial.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="w-1/2 flex flex-col gap-1.5 overflow-y-auto max-h-[220px] pr-2">
              {data.pipelineComercial.map((entry, idx) => (
                <div key={idx} className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-2 truncate">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ background: COLORS[idx % COLORS.length] }}
                    />
                    <span className="text-[var(--hq-text-dim)] truncate">{entry.name}</span>
                  </div>
                  <span className="num font-semibold text-[var(--hq-text)] ml-2">{entry.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Gráfico 2: Projetos por Fase — Jornada */}
      <div className="panel flex flex-col p-6 h-[340px]">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-sky-400" />
            <span className="eyebrow">Projetos por Fase — Jornada</span>
          </div>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center text-[12px] text-[var(--hq-text-ghost)]">
            Carregando gráfico...
          </div>
        ) : (
          <div className="flex-1 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.projetosJornadaFases} margin={{ top: 10, right: 10, left: -25, bottom: 20 }}>
                <XAxis
                  dataKey="name"
                  stroke="var(--hq-text-ghost)"
                  fontSize={10}
                  tickLine={false}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                />
                <YAxis stroke="var(--hq-text-ghost)" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "#18181b",
                    border: "1px solid var(--hq-hairline)",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="value" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}