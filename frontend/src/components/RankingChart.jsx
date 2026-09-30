import React from 'react';

export default function RankingChart({ ranking = [] }) {
  if (!ranking || ranking.length === 0) {
    return (
      <div className="text-center py-10 text-slate-400 text-sm">
        Nenhum dado de simulação disponível para exibição.
      </div>
    );
  }

  // Limita às 10 primeiras para foco visual ou exibe todas com barra de rolagem
  const maxCi = Math.max(...ranking.map(r => r.ci), 1.0);

  return (
    <div className="space-y-3">
      {ranking.map((item) => {
        const percentual = (item.ci / maxCi) * 100;
        let barColor = 'bg-emerald-500';
        let badgeBg = 'bg-emerald-50 text-emerald-700 border-emerald-200';

        if (item.ci < 0.40) {
          barColor = 'bg-rose-500';
          badgeBg = 'bg-rose-50 text-rose-700 border-rose-200';
        } else if (item.ci < 0.70) {
          barColor = 'bg-amber-500';
          badgeBg = 'bg-amber-50 text-amber-700 border-amber-200';
        }

        return (
          <div key={item.municipioId || item.nome} className="group p-2.5 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <div className="flex items-center space-x-2">
                <span className="w-5 h-5 rounded-md bg-slate-100 font-bold text-slate-700 flex items-center justify-center text-[11px]">
                  #{item.posicao}
                </span>
                <span className="font-semibold text-slate-900">
                  {item.nome}
                </span>
                <span className="text-slate-400 font-normal">
                  ({item.uf})
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-slate-400 text-[11px]">
                  D+: {item.distanciaPositiva?.toFixed(3)} | D-: {item.distanciaNegativa?.toFixed(3)}
                </span>
                <span className={`px-2 py-0.5 rounded-md font-mono font-bold text-xs border ${badgeBg}`}>
                  Ci = {item.ci?.toFixed(4)}
                </span>
              </div>
            </div>

            {/* Barra de Progresso com Transição Suave */}
            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-700 ${barColor}`}
                style={{ width: `${Math.max(percentual, 3)}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
