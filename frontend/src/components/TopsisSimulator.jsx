import React, { useState } from 'react';
import { 
  Sliders, 
  RotateCcw, 
  Play, 
  Sparkles, 
  Check, 
  AlertCircle,
  HelpCircle,
  Zap,
  ShieldAlert
} from 'lucide-react';

export default function TopsisSimulator({ 
  criterios = [], 
  municipios = [], 
  onExecutar, 
  carregando = false 
}) {
  // Estado inicial dos pesos dos critérios
  const [pesos, setPesos] = useState(() => {
    const inicial = {};
    criterios.forEach(c => {
      inicial[c.codigo] = parseFloat(c.peso) || 0.0;
    });
    return inicial;
  });

  // Títulos dos cenários
  const [cenarioAtivo, setCenarioAtivo] = useState('benchmark');

  // Seleção de municípios
  const [municipiosSelecionados, setMunicipiosSelecionados] = useState(() => {
    return municipios.map(m => m.id);
  });

  const somaPesos = Object.values(pesos).reduce((acc, val) => acc + (parseFloat(val) || 0), 0);
  const somaPorcentagem = Math.round(somaPesos * 100);

  const handleSliderChange = (codigo, valor) => {
    setCenarioAtivo('custom');
    setPesos(prev => ({
      ...prev,
      [codigo]: parseFloat(valor)
    }));
  };

  const normalizarPesos = () => {
    if (somaPesos <= 0) return;
    const normalizados = {};
    Object.keys(pesos).forEach(k => {
      normalizados[k] = Number((pesos[k] / somaPesos).toFixed(4));
    });
    setPesos(normalizados);
  };

  const aplicarCenario = (tipo) => {
    setCenarioAtivo(tipo);
    if (tipo === 'benchmark') {
      // Benchmark da seção 7.3 do roteiro
      setPesos({
        C1: 0.20,
        C2: 0.20,
        C3: 0.15,
        C4: 0.25,
        C5: 0.20,
        C6: 0.00,
        C7: 0.00
      });
      // Seleciona os municípios benchmark A, B e C
      const idsBenchmark = municipios
        .filter(m => m.nome.includes('Município'))
        .map(m => m.id);
      if (idsBenchmark.length > 0) {
        setMunicipiosSelecionados(idsBenchmark);
      }
    } else if (tipo === 'solar') {
      // Prioridade Solar e Renovável
      setPesos({
        C1: 0.10,
        C2: 0.35,
        C3: 0.10,
        C4: 0.10,
        C5: 0.25,
        C6: 0.00,
        C7: 0.10
      });
      setMunicipiosSelecionados(municipios.map(m => m.id));
    } else if (tipo === 'social') {
      // Foco em Vulnerabilidade Social Crítica
      setPesos({
        C1: 0.35,
        C2: 0.05,
        C3: 0.20,
        C4: 0.15,
        C5: 0.05,
        C6: 0.20,
        C7: 0.00
      });
      setMunicipiosSelecionados(municipios.map(m => m.id));
    } else if (tipo === 'equitativo') {
      // Todos com pesos iguais
      const ativos = criterios.length;
      const pesoIgual = Number((1 / ativos).toFixed(4));
      const novos = {};
      criterios.forEach(c => { novos[c.codigo] = pesoIgual; });
      setPesos(novos);
      setMunicipiosSelecionados(municipios.map(m => m.id));
    }
  };

  const toggleMunicipio = (id) => {
    if (municipiosSelecionados.includes(id)) {
      if (municipiosSelecionados.length > 2) {
        setMunicipiosSelecionados(municipiosSelecionados.filter(item => item !== id));
      }
    } else {
      setMunicipiosSelecionados([...municipiosSelecionados, id]);
    }
  };

  const handleSubmeter = (e) => {
    e.preventDefault();
    if (onExecutar) {
      onExecutar({
        pesosPersonalizados: pesos,
        municipioIds: municipiosSelecionados,
        titulo: `Simulação - ${cenarioAtivo.toUpperCase()}`
      });
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-5 border-b border-slate-100 gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold text-slate-900 font-serif">
              Configuração e Simulador TOPSIS
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
              Multicritério
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Defina a ponderação dos critérios de vulnerabilidade energética e selecione as alternativas.
          </p>
        </div>

        {/* Cenários Pré-definidos */}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => aplicarCenario('benchmark')}
            className={`text-xs px-3 py-1.5 rounded-xl font-semibold transition-all border ${
              cenarioAtivo === 'benchmark'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            ⭐ Benchmark Roteiro (7.3)
          </button>
          <button
            type="button"
            onClick={() => aplicarCenario('solar')}
            className={`text-xs px-3 py-1.5 rounded-xl font-semibold transition-all border ${
              cenarioAtivo === 'solar'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            ☀️ Foco Solar & Renovável
          </button>
          <button
            type="button"
            onClick={() => aplicarCenario('social')}
            className={`text-xs px-3 py-1.5 rounded-xl font-semibold transition-all border ${
              cenarioAtivo === 'social'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            🛡️ Foco Social Crítico
          </button>
          <button
            type="button"
            onClick={() => aplicarCenario('equitativo')}
            className={`text-xs px-3 py-1.5 rounded-xl font-semibold transition-all border ${
              cenarioAtivo === 'equitativo'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            ⚖️ Pesos Iguais
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmeter} className="mt-6 space-y-6">
        
        {/* Barra de Status da Soma dos Pesos */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200 gap-3">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-slate-700">
              Soma total dos pesos:
            </span>
            <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-md ${
              somaPorcentagem === 100
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                : 'bg-amber-100 text-amber-800 border border-amber-200'
            }`}>
              {somaPorcentagem}% ({somaPesos.toFixed(2)})
            </span>
            {somaPorcentagem === 100 ? (
              <span className="text-emerald-600 flex items-center text-xs">
                <Check className="w-3.5 h-3.5 mr-1" /> Normalizado
              </span>
            ) : (
              <span className="text-amber-600 flex items-center text-xs">
                <AlertCircle className="w-3.5 h-3.5 mr-1" /> Requer normalização
              </span>
            )}
          </div>

          {somaPorcentagem !== 100 && (
            <button
              type="button"
              onClick={normalizarPesos}
              className="text-xs px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-medium flex items-center space-x-1.5 transition-colors self-start sm:self-auto"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Normalizar para 100%</span>
            </button>
          )}
        </div>

        {/* Sliders dos Critérios */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {criterios.map((c) => {
            const pesoAtual = pesos[c.codigo] !== undefined ? pesos[c.codigo] : (parseFloat(c.peso) || 0);
            const percentual = Math.round(pesoAtual * 100);
            const isBeneficio = c.tipo === 'beneficio';

            return (
              <div 
                key={c.codigo}
                className="p-4 rounded-xl border border-slate-200 bg-white hover:border-emerald-200 transition-all shadow-2xs"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 rounded-md font-mono font-bold text-xs bg-slate-100 text-slate-800">
                        {c.codigo}
                      </span>
                      <span className="font-semibold text-sm text-slate-900">
                        {c.nome}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                      {c.descricao}
                    </p>
                  </div>

                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                    isBeneficio 
                      ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}>
                    {isBeneficio ? '↑ Benefício' : '↓ Custo'}
                  </span>
                </div>

                <div className="mt-3 flex items-center space-x-4">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={pesoAtual}
                    onChange={(e) => handleSliderChange(c.codigo, e.target.value)}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                  />
                  <div className="w-16 text-right font-mono font-bold text-sm text-slate-900">
                    {percentual}%
                  </div>
                </div>

                <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Unidade: {c.unidade}</span>
                  <span>Fonte: {c.fonte}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Seleção de Municípios Participantes */}
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Alternativas no Cálculo ({municipiosSelecionados.length} de {municipios.length} selecionadas)
            </span>
            <div className="space-x-2">
              <button
                type="button"
                onClick={() => setMunicipiosSelecionados(municipios.map(m => m.id))}
                className="text-xs text-emerald-700 hover:underline font-medium"
              >
                Selecionar Todos
              </button>
              <span className="text-slate-300">|</span>
              <button
                type="button"
                onClick={() => {
                  const b = municipios.filter(m => m.nome.includes('Município')).map(m => m.id);
                  setMunicipiosSelecionados(b);
                }}
                className="text-xs text-emerald-700 hover:underline font-medium"
              >
                Apenas Benchmark A, B, C
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto pr-1">
            {municipios.map((m) => {
              const checked = municipiosSelecionados.includes(m.id);
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => toggleMunicipio(m.id)}
                  className={`text-xs px-3 py-1.5 rounded-lg border font-medium flex items-center space-x-1.5 transition-all ${
                    checked
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-2xs'
                      : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-100 opacity-60'
                  }`}
                >
                  <span className={`w-3.5 h-3.5 rounded flex items-center justify-center text-[10px] ${
                    checked ? 'bg-emerald-600 text-white' : 'border border-slate-300'
                  }`}>
                    {checked && '✓'}
                  </span>
                  <span>{m.nome} ({m.uf})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Botão de Ação Principal */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={carregando}
            className="w-full sm:w-auto px-8 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-semibold flex items-center justify-center space-x-2 shadow-md shadow-emerald-600/30 transition-all cursor-pointer disabled:opacity-50"
          >
            {carregando ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Processando Matriz TOPSIS...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Executar Cálculo TOPSIS</span>
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
}
