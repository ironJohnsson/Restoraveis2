import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import DashboardPage from './pages/DashboardPage';
import SimuladorPage from './pages/SimuladorPage';
import MapaPage from './pages/MapaPage';
import MunicipiosPage from './pages/MunicipiosPage';
import RelatoriosPage from './pages/RelatoriosPage';
import MetodologiaPage from './pages/MetodologiaPage';
import { api } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [apiOnline, setApiOnline] = useState(false);
  const [municipios, setMunicipios] = useState([]);
  const [criterios, setCriterios] = useState([]);
  const [simulacaoAtiva, setSimulacaoAtiva] = useState(null);
  const [carregandoSimulacao, setCarregandoSimulacao] = useState(false);

  useEffect(() => {
    carregarDadosIniciais();
  }, []);

  const carregarDadosIniciais = async () => {
    try {
      // 1. Health check da API
      const statusRes = await api.getStatus();
      if (statusRes.status === 'online') {
        setApiOnline(true);
      }

      // 2. Busca de municípios e critérios
      const [munRes, critRes] = await Promise.all([
        api.getMunicipios(),
        api.getCriterios()
      ]);

      const listaMunicipios = munRes.dados || [];
      const listaCriterios = critRes.dados || [];

      setMunicipios(listaMunicipios);
      setCriterios(listaCriterios);

      // 3. Execução automática do cálculo TOPSIS inicial para alimentar os dashboards
      if (listaMunicipios.length > 0 && listaCriterios.length > 0) {
        setCarregandoSimulacao(true);
        const topsisRes = await api.executarTopsis({
          titulo: 'Simulação Padrão - Benchmark Inicial',
          salvarSimulacao: true
        });

        if (topsisRes.sucesso) {
          setSimulacaoAtiva(topsisRes);
        }
      }
    } catch (err) {
      console.error('Erro ao conectar à API backend:', err);
      setApiOnline(false);
    } finally {
      setCarregandoSimulacao(false);
    }
  };

  const handleExecutarTopsis = async (payload) => {
    try {
      setCarregandoSimulacao(true);
      const res = await api.executarTopsis({
        ...payload,
        salvarSimulacao: true
      });

      if (res.sucesso) {
        setSimulacaoAtiva(res);
        // Exibe feedback e rola suavemente para o resultado
        setActiveTab('dashboard');
      } else {
        alert(`Erro na simulação: ${res.mensagem}`);
      }
    } catch (err) {
      alert('Falha ao comunicar com o servidor para calcular TOPSIS.');
    } finally {
      setCarregandoSimulacao(false);
    }
  };

  const handleCarregarSimulacaoHistorico = (dadosSimulacao) => {
    setSimulacaoAtiva({
      simulacaoId: dadosSimulacao.id,
      titulo: dadosSimulacao.titulo,
      ranking: dadosSimulacao.ranking,
      resumoEstatistico: {
        ciMaximo: Math.max(...dadosSimulacao.ranking.map(r => r.ci)),
        ciMinimo: Math.min(...dadosSimulacao.ranking.map(r => r.ci)),
        ciMedio: Number((dadosSimulacao.ranking.reduce((a, b) => a + b.ci, 0) / dadosSimulacao.ranking.length).toFixed(4)),
        municipioMaisVulneravel: dadosSimulacao.ranking[dadosSimulacao.ranking.length - 1]?.nome,
        municipioMenosVulneravel: dadosSimulacao.ranking[0]?.nome
      }
    });
    setActiveTab('dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-emerald-500 selection:text-white">
      {/* Barra de Navegação Superior */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        apiStatus={apiOnline}
      />

      {/* Conteúdo Principal Dinâmico por Aba */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && (
          <DashboardPage
            simulacao={simulacaoAtiva}
            criterios={criterios}
            municipios={municipios}
            onIrParaSimulador={() => setActiveTab('simulador')}
          />
        )}

        {activeTab === 'simulador' && (
          <SimuladorPage
            criterios={criterios}
            municipios={municipios}
            simulacao={simulacaoAtiva}
            onExecutar={handleExecutarTopsis}
            carregando={carregandoSimulacao}
          />
        )}

        {activeTab === 'mapa' && (
          <MapaPage
            simulacao={simulacaoAtiva}
          />
        )}

        {activeTab === 'municipios' && (
          <MunicipiosPage
            municipios={municipios}
            criterios={criterios}
            onAtualizarDados={carregarDadosIniciais}
          />
        )}

        {activeTab === 'relatorios' && (
          <RelatoriosPage
            onCarregarSimulacao={handleCarregarSimulacaoHistorico}
          />
        )}

        {activeTab === 'metodologia' && (
          <MetodologiaPage />
        )}
      </main>

      {/* Rodapé Padronizado conforme Roteiro */}
      <footer className="bg-white border-t border-slate-200 mt-auto py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500 gap-3">
          <div>
            <span className="font-semibold text-slate-700">Plataforma de Energia Renovável com TOPSIS</span> • ODS 7 ONU
            <p className="text-[11px] text-slate-400 mt-0.5">
              Roteiro elaborado por prof Me. Celso Barreto com base nas normas ISO/IEC 12207, 15504 e 25010
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-[11px] bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-mono">
              React 18 + Vite + Node.js
            </span>
            <a 
              href="http://localhost:5000/api-docs" 
              target="_blank" 
              rel="noreferrer"
              className="text-emerald-700 hover:underline font-semibold"
            >
              Swagger OpenAPI
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
