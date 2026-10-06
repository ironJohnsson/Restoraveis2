import React from 'react';
import { classificar } from '../utils/vulnerabilidade';

export default function RankingChart({ ranking = [] }) {
  if (!ranking || ranking.length === 0) {
    return (
      <div className="text-center py-10 text-slate-400 text-sm">
        Nenhum dado de simulação disponível para exibição.
      </div>
    );
  }

  const maxCi = Math.max(...ranking.map(r => r.ci), 1.0);

  return (
    <div className="space-y-3">
      {ranking.map((item) => {
        const percentual = (item.ci / maxCi) * 100;
        const faixa = classificar(item.ci);
        const barColor = faixa.barra;
        const badgeBg = faixa.badge;

        return (
          <div key={item.municipioId} data-testid="ranking-item" className="group p-2.5 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
            <div className="flex items-center justify-between gap-2 text-xs mb-1.5">
              <div className="flex items-center space-x-2 min-w-0">
                <span className="min-w-5 h-5 px-1 shrink-0 rounded-md bg-slate-100 font-bold text-slate-700 flex items-center justify-center text-[11px]">
                  #{item.posicao}
                </span>
                <span className="font-semibold text-slate-900 truncate" title={item.nome}>
                  {item.nome}
                </span>
                <span className="text-slate-400 font-normal shrink-0">
                  ({item.uf})
                </span>
              </div>
              <div className="flex items-center space-x-2 shrink-0">
                <span className="hidden sm:inline text-slate-400 text-[11px] whitespace-nowrap">
                  D+: {item.distanciaPositiva?.toFixed(3)} | D-: {item.distanciaNegativa?.toFixed(3)}
                </span>
                <span className={`px-2 py-0.5 rounded-md font-mono font-bold text-xs border whitespace-nowrap ${badgeBg}`}>
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
