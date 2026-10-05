import React, { useState } from 'react';
import TopsisSimulator from '../components/TopsisSimulator';
import ResultsTable from '../components/ResultsTable';
import RankingChart from '../components/RankingChart';
import MapaLeaflet from '../components/MapaLeaflet';
import Mensagem from '../components/Mensagem';
import AvisoExcluidas from '../components/AvisoExcluidas';
import { useAuth } from '../hooks/useAuth';
import { useMensagem } from '../hooks/useMensagem';
import { api } from '../services/api';

export default function SimuladorPage({
  criterios = [],
  municipios = [],
  simulacao,
  onExecutar,
  onAtualizarDados,
  carregando
}) {
  const { pode } = useAuth();
  const retorno = useMensagem();
  const [excluidasNoErro, setExcluidasNoErro] = useState([]);

  const executar = async (payload) => {
    retorno.limpar();
    setExcluidasNoErro([]);
    const erro = await onExecutar(payload);
    if (erro) {
      retorno.erro(erro.message);
      setExcluidasNoErro(erro.detalhes?.alternativasExcluidas || []);
    }
  };

  // UC02: pesquisador e administrador podem gravar os pesos como padrão da plataforma
  const salvarPesos = async (pesos) => {
    try {
      await api.updatePesos(pesos);
      retorno.sucesso('Pesos gravados como padrão da plataforma.');
      if (onAtualizarDados) await onAtualizarDados();
    } catch (err) {
      retorno.erro(err.message);
    }
  };

  return (
    <div className="space-y-6">

      {/* Formulário e Controles de Simulação */}
      <TopsisSimulator
        criterios={criterios}
        municipios={municipios}
        onExecutar={executar}
        onSalvarPesos={pode('admin', 'pesquisador') ? salvarPesos : undefined}
        carregando={carregando}
      />

      <Mensagem mensagem={retorno.mensagem} />
      <AvisoExcluidas excluidas={excluidasNoErro} />

      {/* Exibição dos Resultados Obtidos */}
      {simulacao && simulacao.ranking && simulacao.ranking.length > 0 && (
        <div className="space-y-6">
          <AvisoExcluidas excluidas={simulacao.alternativasExcluidas} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h3 className="font-bold text-slate-900 text-base font-serif mb-4 pb-2 border-b border-slate-100">
                Ranking da Simulação Ativa
              </h3>
              <div className="max-h-[420px] overflow-y-auto pr-1">
                <RankingChart ranking={simulacao.ranking} />
              </div>
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
