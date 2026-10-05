import React, { useEffect, useState } from 'react';

const MAXIMO_COMPARADOS = 4;

/**
 * Radar comparativo: cada eixo é um critério da simulação e o raio é o valor do
 * município em relação ao maior valor daquele critério entre as alternativas.
 * `criterios` são os critérios da própria simulação (criteriosInfo), na mesma
 * ordem de `valoresOriginais` de cada item do ranking.
 */
export default function RadarChart({ criterios = [], ranking = [] }) {
  // Seleciona os 3 primeiros por padrão; a seleção é refeita quando muda a simulação
  const idsDoRanking = ranking.map(r => r.municipioId).join(',');
  const [selecionados, setSelecionados] = useState([]);
  useEffect(() => {
    setSelecionados(ranking.slice(0, 3).map(r => r.municipioId));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsDoRanking]);

  const temValores = ranking.some(r => Array.isArray(r.valoresOriginais));
  if (ranking.length === 0 || criterios.length < 3 || !temValores) {
    return null;
  }

  const toggleMunicipio = (id) => {
    if (selecionados.includes(id)) {
      if (selecionados.length > 1) {
        setSelecionados(selecionados.filter(item => item !== id));
      }
    } else if (selecionados.length < MAXIMO_COMPARADOS) {
      setSelecionados([...selecionados, id]);
    }
  };

  const paletaCores = [
    { borda: '#16a34a', preenchimento: 'rgba(22, 163, 74, 0.25)', label: 'Verde' },
    { borda: '#2563eb', preenchimento: 'rgba(37, 99, 235, 0.25)', label: 'Azul' },
    { borda: '#dc2626', preenchimento: 'rgba(220, 38, 38, 0.25)', label: 'Vermelho' },
    { borda: '#9333ea', preenchimento: 'rgba(147, 51, 234, 0.25)', label: 'Roxo' }
  ];

  const centro = 150;
  const raioMaximo = 110;
  const totalCriterios = criterios.length;
  const anguloPasso = (Math.PI * 2) / totalCriterios;

  // Maior valor de cada critério, para levar todos os eixos à escala 0-1
  const maximos = criterios.map((c, j) => {
    const vals = ranking.map(r => (r.valoresOriginais ? Number(r.valoresOriginais[j]) || 0 : 0));
    return Math.max(...vals) || 1;
  });

  const circulosDeGrade = [0.25, 0.5, 0.75, 1.0];

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm" data-testid="radar">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
        <div>
          <h3 className="font-bold text-slate-900 text-base font-serif">
            Diagrama Radar Multicritério
          </h3>
          <p className="text-xs text-slate-500">
            Comparação dos indicadores entre até {MAXIMO_COMPARADOS} alternativas (cada eixo em relação ao maior valor do critério)
          </p>
        </div>

        {/* Seletor de Municípios para Comparação */}
        <div className="flex flex-wrap gap-1.5">
          {ranking.slice(0, 6).map((r, idx) => {
            const isSelected = selecionados.includes(r.municipioId);
            const corIdx = selecionados.indexOf(r.municipioId);
            const estiloCor = isSelected ? paletaCores[corIdx]?.borda : '#94a3b8';

            return (
              <button
                key={r.municipioId}
                type="button"
                aria-pressed={isSelected}
                onClick={() => toggleMunicipio(r.municipioId)}
                className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-all ${
                  isSelected
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
                style={isSelected ? { borderColor: estiloCor } : {}}
              >
                <span 
                  className="inline-block w-2 h-2 rounded-full mr-1.5"
                  style={{ backgroundColor: estiloCor }}
                />
                {r.nome}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-4 flex flex-col md:flex-row items-center justify-center gap-6">
        {/* Gráfico SVG Puro */}
        <div className="relative">
          <svg width="300" height="300" className="overflow-visible" role="img" aria-label="Gráfico radar comparando os municípios selecionados">
            {/* Círculos concêntricos */}
            {circulosDeGrade.map((frac, idx) => (
              <circle
                key={idx}
                cx={centro}
                cy={centro}
                r={raioMaximo * frac}
                fill="none"
                stroke="#e2e8f0"
                strokeDasharray={idx < 3 ? '3 3' : 'none'}
              />
            ))}

            {/* Eixos radiais para cada critério */}
            {criterios.map((c, j) => {
              const angulo = j * anguloPasso - Math.PI / 2;
              const x = centro + raioMaximo * Math.cos(angulo);
              const y = centro + raioMaximo * Math.sin(angulo);
              const labelX = centro + (raioMaximo + 20) * Math.cos(angulo);
              const labelY = centro + (raioMaximo + 16) * Math.sin(angulo);

              return (
                <g key={c.codigo}>
                  <line
                    x1={centro}
                    y1={centro}
                    x2={x}
                    y2={y}
                    stroke="#cbd5e1"
                    strokeWidth="1"
                  />
                  <text
                    x={labelX}
                    y={labelY}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="text-[10px] font-bold fill-slate-600 font-sans"
                  >
                    <title>{`${c.codigo} — ${c.nome}${c.unidade ? ` (${c.unidade})` : ''}`}</title>
                    {c.codigo}
                  </text>
                </g>
              );
            })}

            {/* Polígonos de dados para cada município selecionado */}
            {selecionados.map((munId, sIdx) => {
              const item = ranking.find(r => r.municipioId === munId);
              if (!item || !item.valoresOriginais) return null;

              const pontos = criterios.map((c, j) => {
                const angulo = j * anguloPasso - Math.PI / 2;
                const val = Number(item.valoresOriginais[j]) || 0;
                const frac = Math.min(Math.max(val / maximos[j], 0.05), 1.0);
                const r = raioMaximo * frac;
                const x = centro + r * Math.cos(angulo);
                const y = centro + r * Math.sin(angulo);
                return `${x},${y}`;
              }).join(' ');

              const corConfig = paletaCores[sIdx] || paletaCores[0];

              return (
                <g key={munId}>
                  <polygon
                    points={pontos}
                    fill={corConfig.preenchimento}
                    stroke={corConfig.borda}
                    strokeWidth="2.5"
                    strokeLinejoin="round"
                  />
                  {/* Pontos nos vértices */}
                  {pontos.split(' ').map((p, pIdx) => {
                    const [px, py] = p.split(',');
                    return (
                      <circle
                        key={pIdx}
                        cx={px}
                        cy={py}
                        r="3.5"
                        fill={corConfig.borda}
                      />
                    );
                  })}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Legenda e Métricas Rápidas */}
        <div className="w-full md:w-64 space-y-3">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Legenda Comparativa
          </div>
          {selecionados.map((munId, sIdx) => {
            const item = ranking.find(r => r.municipioId === munId);
            if (!item) return null;
            const corConfig = paletaCores[sIdx] || paletaCores[0];

            return (
              <div key={munId} className="p-2.5 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <span 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: corConfig.borda }}
                  />
                  <span className="font-bold text-slate-800">
                    {item.nome}
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-emerald-700">
                    Ci: {item.ci?.toFixed(4)}
                  </span>
                  <div className="text-[10px] text-slate-500">
                    #{item.posicao} lugar
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
