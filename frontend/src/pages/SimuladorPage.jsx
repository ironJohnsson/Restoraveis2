import React from 'react';
import TopsisSimulator from '../components/TopsisSimulator';
import ResultsTable from '../components/ResultsTable';
import RankingChart from '../components/RankingChart';
import MapaLeaflet from '../components/MapaLeaflet';

export default function SimuladorPage({
  criterios = [],
  municipios = [],
  simulacao,
  onExecutar,
  carregando
}) {
  return (
    <div className="space-y-6">
      
      {/* Formulário e Controles de Simulação */}
      <TopsisSimulator
        criterios={criterios}
        municipios={municipios}
        onExecutar={onExecutar}
        carregando={carregando}
      />

      {/* Exibição dos Resultados Obtidos */}
      {simulacao && simulacao.ranking && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h3 className="font-bold text-slate-900 text-base font-serif mb-4 pb-2 border-b border-slate-100">
                Ranking Gerado
              </h3>
              <RankingChart ranking={simulacao.ranking} />
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h3 className="font-bold text-slate-900 text-base font-serif mb-4 pb-2 border-b border-slate-100">
                Visualização no Mapa
              </h3>
              <MapaLeaflet ranking={simulacao.ranking} altura="380px" />
            </div>
          </div>

          <ResultsTable
            ranking={simulacao.ranking}
            simulacaoId={simulacao.simulacaoId}
            tempoExecucaoMs={simulacao.tempoExecucaoMs}
          />
        </div>
      )}

    </div>
  );
}
