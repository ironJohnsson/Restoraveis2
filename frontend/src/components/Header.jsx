import React from 'react';
import { 
  Zap, 
  BarChart3, 
  Sliders, 
  MapPin, 
  Building2, 
  FileText, 
  BookOpen, 
  CheckCircle2,
  Sparkles
} from 'lucide-react';

export default function Header({ activeTab, setActiveTab, apiStatus }) {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'simulador', label: 'Simulador TOPSIS', icon: Sliders },
    { id: 'mapa', label: 'Mapa Georreferenciado', icon: MapPin },
    { id: 'municipios', label: 'Municípios', icon: Building2 },
    { id: 'relatorios', label: 'Histórico & Relatórios', icon: FileText },
    { id: 'metodologia', label: 'Metodologia & Normas', icon: BookOpen }
  ];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo e Título do Sistema */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-600 to-green-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <Zap className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-bold tracking-tight text-slate-900 font-serif">
                  Plataforma Energia Renovável
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  TOPSIS v1.0
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Mensuração Multicritério de Vulnerabilidade Social Energética • ODS 7 ONU
              </p>
            </div>
          </div>

          {/* Badge de Status e Ações */}
          <div className="hidden md:flex items-center space-x-4">
            <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-medium text-slate-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>API Backend: {apiStatus ? 'Operacional' : 'Conectando...'}</span>
            </div>
            <a 
              href="http://localhost:5000/api-docs" 
              target="_blank" 
              rel="noreferrer"
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-200 transition-colors"
            >
              Swagger Docs ↗
            </a>
          </div>
        </div>

        {/* Barra de Navegação por Abas */}
        <nav className="flex space-x-1 overflow-x-auto py-2 border-t border-slate-100">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
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
    </header>
  );
}
