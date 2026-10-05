import React, { useCallback, useEffect, useState } from 'react';
import Header from './components/Header';
import Mensagem from './components/Mensagem';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import SimuladorPage from './pages/SimuladorPage';
import MapaPage from './pages/MapaPage';
import MunicipiosPage from './pages/MunicipiosPage';
import CriteriosPage from './pages/CriteriosPage';
import RelatoriosPage from './pages/RelatoriosPage';
import UsuariosPage from './pages/UsuariosPage';
import MetodologiaPage from './pages/MetodologiaPage';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { api } from './services/api';

function Plataforma() {
  const { pode } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [apiOnline, setApiOnline] = useState(true);
  const [municipios, setMunicipios] = useState([]);
  const [criterios, setCriterios] = useState([]);
  const [simulacaoAtiva, setSimulacaoAtiva] = useState(null);
  const [carregandoSimulacao, setCarregandoSimulacao] = useState(false);
  const [erro, setErro] = useState(null);

  const carregarCadastros = useCallback(async () => {
    const [munRes, critRes] = await Promise.all([api.getMunicipios(), api.getCriterios()]);
    setMunicipios(munRes.dados || []);
    setCriterios(critRes.dados || []);
    return { municipios: munRes.dados || [], criterios: critRes.dados || [] };
  }, []);

  /**
   * Abre a plataforma com a simulação mais recente do histórico. Se ainda não houver
   * nenhuma, calcula uma prévia com os pesos padrão SEM gravar (o histórico só recebe
   * simulações executadas explicitamente pelo usuário).
   */
  const carregarDadosIniciais = useCallback(async () => {
    setErro(null);
    try {
      const cadastros = await carregarCadastros();
      setApiOnline(true);

      const historico = await api.getSimulacoes(1);
      if (historico.dados && historico.dados.length > 0) {
        const salva = await api.getSimulacao(historico.dados[0].id);
        setSimulacaoAtiva(salva.dados);
      } else if (cadastros.municipios.length >= 2 && cadastros.criterios.length > 0) {
        const previa = await api.executarTopsis({ titulo: 'Prévia com pesos padrão (não salva)', salvarSimulacao: false });
        setSimulacaoAtiva(previa);
      }
    } catch (err) {
      if (err.status === 0) setApiOnline(false);
      // sem alternativas suficientes para a prévia: a tela inicial orienta o usuário
      if (err.status !== 400 && err.status !== 401) setErro(err.message);
    }
  }, [carregarCadastros]);

  useEffect(() => {
    carregarDadosIniciais();
  }, [carregarDadosIniciais]);

  const atualizarCadastros = useCallback(async () => {
    try {
      await carregarCadastros();
    } catch (err) {
      setErro(err.message);
    }
  }, [carregarCadastros]);

  /** Devolve null em caso de sucesso ou a mensagem de erro para a tela do simulador exibir. */
  const handleExecutarTopsis = async (payload) => {
    try {
      setCarregandoSimulacao(true);
      const res = await api.executarTopsis({ ...payload, salvarSimulacao: true });
      setSimulacaoAtiva(res);
      setActiveTab('dashboard');
      window.scrollTo({ top: 0 });
      return null;
    } catch (err) {
      return err;
    } finally {
      setCarregandoSimulacao(false);
    }
  };

  const handleCarregarSimulacaoHistorico = (simulacao) => {
    setSimulacaoAtiva(simulacao);
    setActiveTab('dashboard');
    window.scrollTo({ top: 0 });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-emerald-500 selection:text-white">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} apiStatus={apiOnline} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {erro && (
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1"><Mensagem mensagem={{ tipo: 'erro', texto: erro }} /></div>
            <button type="button" onClick={carregarDadosIniciais} className="text-xs font-semibold text-emerald-700 hover:underline whitespace-nowrap">
              Tentar novamente
            </button>
          </div>
        )}

        {activeTab === 'dashboard' && (
          <DashboardPage
            simulacao={simulacaoAtiva}
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
            onAtualizarDados={atualizarCadastros}
            carregando={carregandoSimulacao}
          />
        )}

        {activeTab === 'mapa' && <MapaPage simulacao={simulacaoAtiva} />}

        {activeTab === 'municipios' && (
          <MunicipiosPage municipios={municipios} criterios={criterios} onAtualizarDados={atualizarCadastros} />
        )}

        {activeTab === 'criterios' && (
          <CriteriosPage criterios={criterios} onAtualizarDados={atualizarCadastros} />
        )}

        {activeTab === 'relatorios' && (
          <RelatoriosPage onCarregarSimulacao={handleCarregarSimulacaoHistorico} />
        )}

        {activeTab === 'usuarios' && pode('admin') && <UsuariosPage />}

        {activeTab === 'metodologia' && <MetodologiaPage criterios={criterios} />}
      </main>

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
            <a href="/api-docs" target="_blank" rel="noreferrer" className="text-emerald-700 hover:underline font-semibold">
              Swagger OpenAPI
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Raiz() {
  const { usuario, carregando } = useAuth();

  if (carregando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" aria-label="Carregando"></div>
      </div>
    );
  }

  // `key` reinicia todo o estado da plataforma quando outro usuário entra
  return usuario ? <Plataforma key={usuario.id} /> : <LoginPage />;
}

export default function App() {
  return (
    <AuthProvider>
      <Raiz />
    </AuthProvider>
  );
}
