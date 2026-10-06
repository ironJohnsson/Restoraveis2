import React, { useState, useEffect } from 'react';
import { FileText, History, Eye, Calendar, User } from 'lucide-react';
import { api } from '../services/api';
import BotoesRelatorio from '../components/BotoesRelatorio';
import Mensagem from '../components/Mensagem';
import { formatarDataHora } from '../utils/formato';

export default function RelatoriosPage({ onCarregarSimulacao }) {
  const [historico, setHistorico] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    carregarHistorico();
  }, []);

  const carregarHistorico = async () => {
    try {
      setCarregando(true);
      setErro(null);
      const res = await api.getSimulacoes();
      setHistorico(res.dados || []);
    } catch (err) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  };

  const handleVisualizar = async (id) => {
    try {
      setErro(null);
      const res = await api.getSimulacao(id);
      if (onCarregarSimulacao) {
        onCarregarSimulacao(res.dados);
      }
    } catch (err) {
      setErro(err.message);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Topo da Página */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold text-slate-900 font-serif">
              Histórico de Simulações e Relatórios
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
              RF06 & RF10
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Registro auditável de simulações realizadas com exportação de dados em CSV e relatórios analíticos em PDF.
          </p>
        </div>

        <button
          type="button"
          onClick={carregarHistorico}
          className="self-start sm:self-auto px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition-colors flex items-center space-x-2"
        >
          <History className="w-4 h-4" />
          <span>Atualizar Histórico</span>
        </button>
      </div>

      {erro && <Mensagem mensagem={{ tipo: 'erro', texto: erro }} />}

      {/* Lista de Simulações */}
      {carregando ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-xs text-slate-500">Carregando histórico de simulações...</p>
        </div>
      ) : historico.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h4 className="text-sm font-bold text-slate-700">Nenhuma simulação registrada</h4>
          <p className="text-xs text-slate-500 mt-1">
            Execute uma simulação na aba "Simulador TOPSIS" para gerar relatórios.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {historico.map((sim) => (
            <div
              key={sim.id}
              data-testid="cartao-simulacao"
              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:border-emerald-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 font-bold text-xs flex items-center justify-center border border-emerald-200">
                      #{sim.id}
                    </span>
                    <h3 className="font-bold text-slate-900 text-sm font-serif line-clamp-1">
                      {sim.titulo || 'Simulação TOPSIS'}
                    </h3>
                  </div>
                  <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 capitalize">
                    {sim.status}
                  </span>
                </div>

                <div className="mt-3 space-y-1 text-xs text-slate-500">
                  <div className="flex items-center space-x-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Execução: {formatarDataHora(sim.data_execucao)}</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>Usuário: {sim.usuario_nome || 'Conta removida'}</span>
                  </div>
                </div>

                <div className="mt-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Alternativas:</span>
                    <strong className="text-slate-800">{sim.total_municipios} municípios</strong>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-500 block text-[11px]">1º Colocado:</span>
                    <strong className="text-emerald-700">{sim.melhor_classificado || '-'}</strong>
                  </div>
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  data-testid={`carregar-simulacao-${sim.id}`}
                  onClick={() => handleVisualizar(sim.id)}
                  className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center space-x-1"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Carregar no Dashboard</span>
                </button>

                <BotoesRelatorio simulacaoId={sim.id} compacto />
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
}
