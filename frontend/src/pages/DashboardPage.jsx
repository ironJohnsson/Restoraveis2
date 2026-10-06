import React from 'react';
import {
  Building2,
  TrendingUp,
  AlertTriangle,
  Award,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import KpiCard from '../components/KpiCard';
import RankingChart from '../components/RankingChart';
import MapaLeaflet from '../components/MapaLeaflet';
import RadarChart from '../components/RadarChart';
import ResultsTable from '../components/ResultsTable';
import AvisoExcluidas from '../components/AvisoExcluidas';
import { formatarDataHora, formatarNumero } from '../utils/formato';

export default function DashboardPage({
  simulacao,
  municipios = [],
  onIrParaSimulador
}) {
  const ranking = simulacao?.ranking || [];
  const resumo = simulacao?.resumoEstatistico;

  const top1 = ranking[0];
  const maisVulneravel = ranking[ranking.length - 1];

  return (
    <div className="space-y-6">
      
      {/* Banner de Boas-Vindas e Ação Rápida */}
      <div className="rounded-3xl bg-gradient-to-r from-emerald-800 via-emerald-700 to-green-600 p-6 sm:p-8 text-white shadow-lg shadow-emerald-900/10 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-900/50 backdrop-blur-md text-emerald-200 text-xs font-semibold mb-3 border border-emerald-500/30">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Sistema Multicritério de Apoio à Tomada de Decisão</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif tracking-tight">
            Diagnóstico de Vulnerabilidade Social Energética
          </h1>
          <p className="mt-2 text-emerald-100 text-sm leading-relaxed">
            Plataforma para priorização de investimentos em energia renovável através do método matemático TOPSIS. 
            Identifique áreas prioritárias, simule políticas públicas e exporte relatórios executivos.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              onClick={onIrParaSimulador}
              className="px-5 py-2.5 rounded-xl bg-white text-emerald-900 hover:bg-emerald-50 font-bold text-xs shadow-md transition-all flex items-center space-x-2"
            >
              <span>Configurar Nova Simulação</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <div data-testid="simulacao-ativa" className="px-4 py-2.5 rounded-xl bg-emerald-900/40 text-emerald-200 text-xs font-medium border border-emerald-500/30 flex flex-wrap items-center gap-x-2">
              <span>Simulação ativa:</span>
              <strong className="text-white">{simulacao?.titulo || 'Nenhuma'}</strong>
              {simulacao?.simulacaoId ? (
                <span>#{simulacao.simulacaoId} • {formatarDataHora(simulacao.dataExecucao)}</span>
              ) : simulacao ? (
                <span>(não salva no histórico)</span>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {ranking.length === 0 && (
        <div className="p-5 rounded-2xl border border-slate-200 bg-white text-sm text-slate-600" data-testid="sem-simulacao">
          Ainda não há simulação para exibir. Cadastre ao menos 2 municípios com indicadores e execute o cálculo no Simulador TOPSIS.
        </div>
      )}

      <AvisoExcluidas excluidas={simulacao?.alternativasExcluidas} />

      {/* Cartões KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" data-testid="kpis">
        <KpiCard
          title="Municípios Avaliados"
          value={ranking.length}
          subtitle={`Total de alternativas no banco: ${municipios.length}`}
          icon={Building2}
          color="blue"
          tag="Alternativas"
        />
        <KpiCard
          title="Média do Índice Ci"
          value={formatarNumero(resumo?.ciMedio, 3)}
          subtitle="Proximidade relativa média"
          icon={TrendingUp}
          color="emerald"
          tag="Escala 0 a 1"
        />
        <KpiCard
          title="Menor Vulnerabilidade"
          value={top1 ? top1.nome : '-'}
          subtitle={`1º Lugar (Ci = ${formatarNumero(top1?.ci, 4)})`}
          icon={Award}
          color="emerald"
          tag="Melhor Acesso"
        />
        <KpiCard
          title="Maior Vulnerabilidade"
          value={maisVulneravel ? maisVulneravel.nome : '-'}
          subtitle={`Prioridade 1 em investimentos (Ci = ${formatarNumero(maisVulneravel?.ci, 4)})`}
          icon={AlertTriangle}
          color="rose"
          tag="Crítico"
        />
      </div>

      {/* Painel Central: Gráfico de Ranking e Mapa Georreferenciado */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Coluna Esquerda: Gráfico de Barras do Ranking */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base font-serif">
                Classificação das Alternativas
              </h3>
              <p className="text-xs text-slate-500">
                Ordenação por proximidade relativa à solução ideal
              </p>
            </div>
            <span className="text-xs font-semibold px-2 py-1 rounded-md bg-slate-100 text-slate-700">
              Ci TOPSIS
            </span>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[460px] pr-1">
            <RankingChart ranking={ranking} />
          </div>
        </div>

        {/* Coluna Direita: Mapa Interativo com Leaflet */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base font-serif">
                Distribuição Espacial da Vulnerabilidade
              </h3>
              <p className="text-xs text-slate-500">
                Visualização cartográfica com categorização cromática por índice
              </p>
            </div>
            <div className="flex items-center space-x-1.5 text-xs text-slate-500 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>OpenStreetMap / Leaflet</span>
            </div>
          </div>

          <div className="flex-1 min-h-[420px]">
            <MapaLeaflet ranking={ranking} altura="430px" />
          </div>
        </div>

      </div>

      {/* Diagrama Radar Comparativo */}
      <RadarChart criterios={simulacao?.criteriosInfo || []} ranking={ranking} />

      {/* Tabela Oficial de Resultados */}
      <ResultsTable 
        ranking={ranking} 
        simulacaoId={simulacao?.simulacaoId}
        tempoExecucaoMs={simulacao?.tempoExecucaoMs}
      />

    </div>
  );
}
