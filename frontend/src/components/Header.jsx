import React, { useState } from 'react';
import {
  Zap,
  BarChart3,
  Sliders,
  MapPin,
  Building2,
  FileText,
  BookOpen,
  ListChecks,
  Users,
  LogOut,
  KeyRound
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';
import { PERFIS } from '../utils/formato';

export const ABAS = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  { id: 'simulador', label: 'Simulador TOPSIS', icon: Sliders },
  { id: 'mapa', label: 'Mapa', icon: MapPin },
  { id: 'municipios', label: 'Municípios', icon: Building2 },
  { id: 'criterios', label: 'Critérios', icon: ListChecks },
  { id: 'relatorios', label: 'Histórico & Relatórios', icon: FileText },
  { id: 'usuarios', label: 'Usuários', icon: Users, perfis: ['admin'] },
  { id: 'metodologia', label: 'Metodologia', icon: BookOpen }
];

function ModalSenha({ onFechar }) {
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [retorno, setRetorno] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setEnviando(true);
    setRetorno(null);
    try {
      await api.alterarSenha(senhaAtual, novaSenha);
      setRetorno({ tipo: 'sucesso', texto: 'Senha alterada com sucesso.' });
      setSenhaAtual('');
      setNovaSenha('');
    } catch (err) {
      setRetorno({ tipo: 'erro', texto: err.message });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-[1000]">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-xl border border-slate-200">
        <h3 className="font-bold text-slate-900 text-lg font-serif mb-4">Alterar minha senha</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label htmlFor="senha-atual" className="block text-xs font-semibold text-slate-700 mb-1">Senha atual</label>
            <input id="senha-atual" type="password" required autoComplete="current-password" value={senhaAtual}
              onChange={e => setSenhaAtual(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500" />
          </div>
          <div>
            <label htmlFor="nova-senha" className="block text-xs font-semibold text-slate-700 mb-1">Nova senha (mínimo 8 caracteres)</label>
            <input id="nova-senha" type="password" required minLength={8} autoComplete="new-password" value={novaSenha}
              onChange={e => setNovaSenha(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500" />
          </div>
          {retorno && (
            <p role="alert" className={`text-xs font-semibold ${retorno.tipo === 'sucesso' ? 'text-emerald-700' : 'text-rose-700'}`}>
              {retorno.texto}
            </p>
          )}
          <div className="flex justify-end space-x-2 pt-2">
            <button type="button" onClick={onFechar} className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100">
              Fechar
            </button>
            <button type="submit" disabled={enviando} className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs disabled:opacity-50">
              {enviando ? 'Salvando...' : 'Alterar senha'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Header({ activeTab, setActiveTab, apiStatus }) {
  const { usuario, sair, pode } = useAuth();
  const [modalSenha, setModalSenha] = useState(false);
  const abas = ABAS.filter(aba => !aba.perfis || pode(...aba.perfis));

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between min-h-20 py-2 gap-x-3 gap-y-1">

          {/* Logo e Título do Sistema */}
          <button type="button" className="flex items-center space-x-3 text-left min-w-0" onClick={() => setActiveTab('dashboard')}>
            <div className="w-12 h-12 shrink-0 rounded-xl bg-gradient-to-tr from-emerald-600 to-green-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <Zap className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center flex-wrap gap-x-2">
                <span className="text-base sm:text-xl font-bold tracking-tight text-slate-900 font-serif">
                  Plataforma Energia Renovável
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  TOPSIS v1.1
                </span>
              </div>
              <p className="hidden sm:block text-xs text-slate-500 font-medium">
                Mensuração Multicritério de Vulnerabilidade Social Energética • ODS 7 ONU
              </p>
            </div>
          </button>

          {/* Status da API, usuário e ações */}
          <div className="flex items-center space-x-2 sm:space-x-3 ml-auto">
            <div className="hidden lg:flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-medium text-slate-600">
              <span className={`w-2 h-2 rounded-full ${apiStatus ? 'bg-emerald-500' : 'bg-rose-500 animate-pulse'}`}></span>
              <span>API: {apiStatus ? 'Operacional' : 'Indisponível'}</span>
            </div>
            <a
              href="/api-docs"
              target="_blank"
              rel="noreferrer"
              className="hidden md:inline-block text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-200 transition-colors"
            >
              Swagger Docs ↗
            </a>
            <div className="text-right leading-tight" data-testid="usuario-logado">
              <div className="text-xs font-bold text-slate-900 max-w-[140px] truncate">{usuario.nome}</div>
              <div className="text-[11px] text-emerald-700 font-semibold">{PERFIS[usuario.perfil] || usuario.perfil}</div>
            </div>
            <button
              type="button"
              onClick={() => setModalSenha(true)}
              title="Alterar minha senha"
              aria-label="Alterar minha senha"
              className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100"
            >
              <KeyRound className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={sair}
              title="Sair"
              aria-label="Sair"
              className="p-2 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Barra de Navegação por Abas */}
        <nav className="flex space-x-1 overflow-x-auto py-2 border-t border-slate-100" aria-label="Seções da plataforma">
          {abas.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                data-testid={`aba-${tab.id}`}
                aria-current={isActive ? 'page' : undefined}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {modalSenha && <ModalSenha onFechar={() => setModalSenha(false)} />}
    </header>
  );
}
