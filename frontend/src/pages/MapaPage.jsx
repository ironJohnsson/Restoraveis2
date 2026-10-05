import React, { useCallback, useMemo, useState } from 'react';
import { Filter, Flame, MapPin } from 'lucide-react';
import MapaLeaflet from '../components/MapaLeaflet';
import { LIMITE_BAIXA, LIMITE_MEDIA } from '../utils/vulnerabilidade';

const VULNERABILIDADE = 'vulnerabilidade';

export default function MapaPage({ simulacao }) {
  const ranking = simulacao?.ranking || [];
  const criterios = simulacao?.criteriosInfo || [];
  const [filtroNivel, setFiltroNivel] = useState('todos');
  const [camada, setCamada] = useState('marcadores');
  const [indicador, setIndicador] = useState(VULNERABILIDADE);

  const filtrados = useMemo(() => ranking.filter((item) => {
    if (filtroNivel === 'alta') return item.ci < LIMITE_MEDIA;
    if (filtroNivel === 'media') return item.ci >= LIMITE_MEDIA && item.ci < LIMITE_BAIXA;
    if (filtroNivel === 'baixa') return item.ci >= LIMITE_BAIXA;
    return true;
  }), [ranking, filtroNivel]);

  const totalAlta = ranking.filter(r => r.ci < LIMITE_MEDIA).length;
  const totalMedia = ranking.filter(r => r.ci >= LIMITE_MEDIA && r.ci < LIMITE_BAIXA).length;
  const totalBaixa = ranking.filter(r => r.ci >= LIMITE_BAIXA).length;

  // Camada de calor por indicador: intensidade = valor do município / maior valor do critério
  const indiceCriterio = criterios.findIndex(c => c.codigo === indicador);
  const criterioSelecionado = indiceCriterio >= 0 ? criterios[indiceCriterio] : null;
  const maximo = useMemo(() => {
    if (indiceCriterio < 0) return 1;
    return Math.max(...ranking.map(r => Number(r.valoresOriginais?.[indiceCriterio]) || 0)) || 1;
  }, [ranking, indiceCriterio]);

  const intensidade = useCallback((item) => {
    if (indiceCriterio < 0) return 1 - item.ci;
    return (Number(item.valoresOriginais?.[indiceCriterio]) || 0) / maximo;
  }, [indiceCriterio, maximo]);

  const legendaCalor = criterioSelecionado
    ? `${criterioSelecionado.codigo} — ${criterioSelecionado.nome}${criterioSelecionado.unidade ? ` (${criterioSelecionado.unidade})` : ''}`
    : 'Vulnerabilidade (1 − Ci)';
  const temValores = ranking.some(r => Array.isArray(r.valoresOriginais));

  return (
    <div className="space-y-6">

      {/* Cabeçalho da Página de Mapas */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-bold text-slate-900 font-serif">
                Módulo Cartográfico Georreferenciado
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                RF07
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Espacialização do ranking e dos indicadores de vulnerabilidade social energética da simulação ativa.
            </p>
          </div>

          {/* Filtros por Categoria de Vulnerabilidade */}
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setFiltroNivel('todos')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  filtroNivel === 'todos' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Todos ({ranking.length})
              </button>
              <button
                type="button"
                onClick={() => setFiltroNivel('alta')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  filtroNivel === 'alta' ? 'bg-rose-600 text-white shadow-xs' : 'text-rose-700 hover:bg-rose-50'
                }`}
              >
                Alta Vuln. ({totalAlta})
              </button>
              <button
                type="button"
                onClick={() => setFiltroNivel('media')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  filtroNivel === 'media' ? 'bg-amber-500 text-white shadow-xs' : 'text-amber-700 hover:bg-amber-50'
                }`}
              >
                Média ({totalMedia})
              </button>
              <button
                type="button"
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

        {/* Seleção de camada: marcadores ou calor por indicador */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-3 border-t border-slate-100">
          <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs font-semibold self-start">
            <button
              type="button"
              data-testid="camada-marcadores"
              aria-pressed={camada === 'marcadores'}
              onClick={() => setCamada('marcadores')}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg transition-all ${
                camada === 'marcadores' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Marcadores</span>
            </button>
            <button
              type="button"
              data-testid="camada-calor"
              aria-pressed={camada === 'calor'}
              onClick={() => setCamada('calor')}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg transition-all ${
                camada === 'calor' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Mapa de calor</span>
            </button>
          </div>

          {camada === 'calor' && (
            <label className="flex items-center space-x-2 text-xs text-slate-600">
              <span className="font-semibold">Indicador:</span>
              <select
                data-testid="indicador-calor"
                value={indicador}
                onChange={e => setIndicador(e.target.value)}
                className="px-2 py-1.5 border border-slate-200 rounded-lg text-xs bg-white"
              >
                <option value={VULNERABILIDADE}>Vulnerabilidade (1 − Ci)</option>
                {temValores && criterios.map(c => (
                  <option key={c.codigo} value={c.codigo}>{c.codigo} — {c.nome}</option>
                ))}
              </select>
            </label>
          )}
        </div>
      </div>

      {ranking.length === 0 && (
        <div className="text-center py-10 bg-white rounded-2xl border border-slate-200 text-sm text-slate-500">
          Nenhuma simulação ativa. Execute o cálculo na aba "Simulador TOPSIS" para visualizar o mapa.
        </div>
      )}

      {/* Mapa em Destaque */}
      <MapaLeaflet
        ranking={filtrados}
        altura="580px"
        camada={camada}
        intensidade={intensidade}
        legendaCalor={legendaCalor}
      />

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
