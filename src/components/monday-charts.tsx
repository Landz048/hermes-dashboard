{/* 4. Carga por Responsável — Comercial (Barras Horizontais) */}
        <div className="panel flex flex-col p-6 min-h-[340px] h-full">
          <div className="flex items-center gap-2 mb-2">
            <UserCheck className="w-4 h-4 text-purple-400" />
            <span className="eyebrow">Carga por Responsável — Comercial</span>
          </div>

          {loading ? (
            <div className="flex-1 flex items-center justify-center text-[12px] text-[var(--hq-text-ghost)]">Carregando...</div>
          ) : (
            <div className="flex-1 w-full mt-2 h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.cargaResponsavel}
                  layout="vertical"
                  margin={{ top: 10, right: 25, left: 15, bottom: 10 }}
                >
                  <XAxis type="number" allowDecimals={false} stroke="var(--hq-text-ghost)" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="name" stroke="var(--hq-text-ghost)" fontSize={11} tickLine={false} axisLine={false} width={65} />
                  <Tooltip
                    contentStyle={{ background: "#18181b", border: "1px solid var(--hq-hairline)", borderRadius: "8px", fontSize: "12px" }}
                  />
                  <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={18} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>