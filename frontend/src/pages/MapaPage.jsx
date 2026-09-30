import React, { useState } from 'react';
import { Filter, Layers, MapPin, Info } from 'lucide-react';
import MapaLeaflet from '../components/MapaLeaflet';

export default function MapaPage({ simulacao }) {
  const ranking = simulacao?.ranking || [];
  const [filtroNivel, setFiltroNivel] = useState('todos');

  const filtrados = ranking.filter(item => {
    if (filtroNivel === 'todos') return true;
    if (filtroNivel === 'alta') return item.ci < 0.40;
    if (filtroNivel === 'media') return item.ci >= 0.40 && item.ci < 0.70;
    if (filtroNivel === 'baixa') return item.ci >= 0.70;
    return true;
  });

  const totalAlta = ranking.filter(r => r.ci < 0.40).length;
  const totalMedia = ranking.filter(r => r.ci >= 0.40 && r.ci < 0.70).length;
  const totalBaixa = ranking.filter(r => r.ci >= 0.70).length;

  return (
    <div className="space-y-6">
      
      {/* Cabeçalho da Página de Mapas */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold text-slate-900 font-serif">
              Módulo Cartográfico Georreferenciado
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
              SIG / GIS
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Espacialização dos indicadores de vulnerabilidade social e energética (Norma ISO/IEC 12207 - Visualização).
          </p>
        </div>

        {/* Filtros por Categoria de Vulnerabilidade */}
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setFiltroNivel('todos')}
              className={`px-3 py-1 rounded-lg transition-all ${
                filtroNivel === 'todos' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todos ({ranking.length})
            </button>
            <button
              onClick={() => setFiltroNivel('alta')}
              className={`px-3 py-1 rounded-lg transition-all ${
                filtroNivel === 'alta' ? 'bg-rose-600 text-white shadow-xs' : 'text-rose-700 hover:bg-rose-50'
              }`}
            >
              Alta Vuln. ({totalAlta})
            </button>
            <button
              onClick={() => setFiltroNivel('media')}
              className={`px-3 py-1 rounded-lg transition-all ${
                filtroNivel === 'media' ? 'bg-amber-500 text-white shadow-xs' : 'text-amber-700 hover:bg-amber-50'
              }`}
            >
              Média ({totalMedia})
            </button>
            <button
              onClick={() => setFiltroNivel('baixa')}
              className={`px-3 py-1 rounded-lg transition-all ${
                filtroNivel === 'baixa' ? 'bg-emerald-600 text-white shadow-xs' : 'text-emerald-700 hover:bg-emerald-50'
              }`}
            >
              Baixa ({totalBaixa})
            </button>
          </div>
        </div>
      </div>

      {/* Mapa em Destaque */}
      <MapaLeaflet ranking={filtrados} altura="580px" />

      {/* Tabela de Apoio com Localização e Metadados */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h3 className="font-bold text-slate-900 text-base font-serif mb-4">
          Alternativas Plotadas ({filtrados.length})
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {filtrados.map((m) => (
            <div key={m.municipioId} className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-xs">
                    {m.nome} ({m.uf})
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold bg-white border border-slate-200">
                    #{m.posicao}
                  </span>
                </div>
                <div className="mt-1 text-[11px] text-slate-500">
                  Lat: {parseFloat(m.latitude).toFixed(4)} | Lng: {parseFloat(m.longitude).toFixed(4)}
                </div>
              </div>
              <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                <span className="text-slate-500 text-[11px]">Índice Ci:</span>
                <span className="font-mono font-bold" style={{ color: m.corVulnerabilidade }}>
                  {m.ci.toFixed(4)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
