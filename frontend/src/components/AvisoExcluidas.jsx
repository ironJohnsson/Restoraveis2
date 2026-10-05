import React from 'react';
import { AlertTriangle } from 'lucide-react';

/** Lista os municípios que ficaram fora do cálculo por falta de dados em critérios ponderados. */
export default function AvisoExcluidas({ excluidas = [] }) {
  if (!excluidas || excluidas.length === 0) return null;

  return (
    <div data-testid="aviso-excluidas" className="p-4 rounded-2xl border border-amber-200 bg-amber-50 text-xs text-amber-900">
      <div className="flex items-center space-x-2 font-bold">
        <AlertTriangle className="w-4 h-4" />
        <span>
          {excluidas.length} município(s) não entraram no cálculo por falta de dados
        </span>
      </div>
      <p className="mt-1 text-amber-800">
        Tratar um dado ausente como zero distorceria o ranking. Complete os indicadores na aba "Municípios"
        ou zere o peso do critério no simulador.
      </p>
      <ul className="mt-2 space-y-0.5 max-h-28 overflow-y-auto">
        {excluidas.map(e => (
          <li key={e.municipioId}>
            <strong>{e.nome} ({e.uf})</strong>: sem dado em {e.criteriosSemDado.join(', ')}
          </li>
        ))}
      </ul>
    </div>
  );
}
