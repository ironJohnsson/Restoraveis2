import React, { useEffect, useState } from 'react';
import { RotateCcw, Play, Check, AlertCircle, Save } from 'lucide-react';

// Pesos do exemplo numérico 7.3 do roteiro; qualquer outro critério entra com peso zero
const PESOS_BENCHMARK = { C1: 0.20, C2: 0.20, C3: 0.15, C4: 0.25, C5: 0.20 };
const PESOS_SOLAR = { C1: 0.10, C2: 0.35, C3: 0.10, C4: 0.10, C5: 0.25, C7: 0.10 };
const PESOS_SOCIAL = { C1: 0.35, C2: 0.05, C3: 0.20, C4: 0.15, C5: 0.05, C6: 0.20 };
const MINIMO_ALTERNATIVAS = 2;

const ehBenchmark = municipio => municipio.nome.includes('(Benchmark)');

function pesosPadrao(criterios) {
  const inicial = {};
  criterios.forEach((c) => {
    inicial[c.codigo] = parseFloat(c.peso) || 0;
  });
  return inicial;
}

export default function TopsisSimulator({
  criterios = [],
  municipios = [],
  onExecutar,
  onSalvarPesos,
  carregando = false
}) {
  const [pesos, setPesos] = useState(() => pesosPadrao(criterios));
  const [cenarioAtivo, setCenarioAtivo] = useState('padrao');
  const [municipiosSelecionados, setMunicipiosSelecionados] = useState(() => municipios.map(m => m.id));

  // Quando os cadastros chegam da API (ou mudam), sincroniza pesos e seleção
  const chaveCriterios = criterios.map(c => `${c.codigo}:${c.peso}`).join('|');
  const chaveMunicipios = municipios.map(m => m.id).join(',');
  useEffect(() => {
    setPesos(pesosPadrao(criterios));
    setCenarioAtivo('padrao');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chaveCriterios]);
  useEffect(() => {
    setMunicipiosSelecionados(municipios.map(m => m.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chaveMunicipios]);

  const somaPesos = criterios.reduce((acc, c) => acc + (parseFloat(pesos[c.codigo]) || 0), 0);
  const somaPorcentagem = Math.round(somaPesos * 100);
  const somaValida = Math.abs(somaPesos - 1) <= 0.001;

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
    criterios.forEach((c) => {
      normalizados[c.codigo] = Number(((parseFloat(pesos[c.codigo]) || 0) / somaPesos).toFixed(4));
    });
    setPesos(normalizados);
  };

  /** Aplica um conjunto de pesos por código; critérios fora do conjunto ficam com zero. */
  const aplicarPesos = (conjunto) => {
    const novos = {};
    criterios.forEach((c) => { novos[c.codigo] = conjunto[c.codigo] || 0; });
    setPesos(novos);
  };

  const aplicarCenario = (tipo) => {
    setCenarioAtivo(tipo);
    if (tipo === 'padrao') {
      setPesos(pesosPadrao(criterios));
      setMunicipiosSelecionados(municipios.map(m => m.id));
    } else if (tipo === 'benchmark') {
      // Exemplo 7.3 do roteiro: municípios A, B e C com os pesos da seção
      aplicarPesos(PESOS_BENCHMARK);
      const idsBenchmark = municipios.filter(ehBenchmark).map(m => m.id);
      if (idsBenchmark.length >= MINIMO_ALTERNATIVAS) {
        setMunicipiosSelecionados(idsBenchmark);
      }
    } else if (tipo === 'solar') {
      aplicarPesos(PESOS_SOLAR);
      setMunicipiosSelecionados(municipios.map(m => m.id));
    } else if (tipo === 'social') {
      aplicarPesos(PESOS_SOCIAL);
      setMunicipiosSelecionados(municipios.map(m => m.id));
    } else if (tipo === 'equitativo') {
      const novos = {};
      criterios.forEach((c) => { novos[c.codigo] = Number((1 / criterios.length).toFixed(4)); });
      setPesos(novos);
      setMunicipiosSelecionados(municipios.map(m => m.id));
    }
  };

  const toggleMunicipio = (id) => {
    if (municipiosSelecionados.includes(id)) {
      if (municipiosSelecionados.length > MINIMO_ALTERNATIVAS) {
        setMunicipiosSelecionados(municipiosSelecionados.filter(item => item !== id));
      }
    } else {
      setMunicipiosSelecionados([...municipiosSelecionados, id]);
    }
  };

  const NOMES_CENARIOS = {
    padrao: 'Pesos padrão',
    benchmark: 'Benchmark do roteiro (7.3)',
    solar: 'Foco solar e renovável',
    social: 'Foco social crítico',
    equitativo: 'Pesos iguais',
    custom: 'Pesos personalizados'
  };

  const handleSubmeter = (e) => {
    e.preventDefault();
    if (onExecutar) {
      const pesosPersonalizados = {};
      criterios.forEach((c) => { pesosPersonalizados[c.codigo] = parseFloat(pesos[c.codigo]) || 0; });
      onExecutar({
        pesosPersonalizados,
        municipioIds: municipiosSelecionados,
        titulo: `Simulação — ${NOMES_CENARIOS[cenarioAtivo]}`
      });
    }
  };

  const cenarios = [
    { id: 'padrao', rotulo: '📌 Pesos Padrão' },
    { id: 'benchmark', rotulo: '⭐ Benchmark Roteiro (7.3)' },
    { id: 'solar', rotulo: '☀️ Foco Solar & Renovável' },
    { id: 'social', rotulo: '🛡️ Foco Social Crítico' },
    { id: 'equitativo', rotulo: '⚖️ Pesos Iguais' }
  ];

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
          {cenarios.map(cenario => (
            <button
              key={cenario.id}
              type="button"
              data-testid={`cenario-${cenario.id}`}
              aria-pressed={cenarioAtivo === cenario.id}
              onClick={() => aplicarCenario(cenario.id)}
              className={`text-xs px-3 py-1.5 rounded-xl font-semibold transition-all border ${
                cenarioAtivo === cenario.id
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {cenario.rotulo}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmeter} className="mt-6 space-y-6">
        
        {/* Barra de Status da Soma dos Pesos */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200 gap-3">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-slate-700">
              Soma total dos pesos:
            </span>
            <span data-testid="soma-pesos" className={`text-xs font-mono font-bold px-2 py-0.5 rounded-md ${
              somaValida
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                : 'bg-amber-100 text-amber-800 border border-amber-200'
            }`}>
              {somaPorcentagem}% ({somaPesos.toFixed(2)})
            </span>
            {somaValida ? (
              <span className="text-emerald-600 flex items-center text-xs">
                <Check className="w-3.5 h-3.5 mr-1" /> Soma = 1,0
              </span>
            ) : (
              <span className="text-amber-600 flex items-center text-xs">
                <AlertCircle className="w-3.5 h-3.5 mr-1" /> Será normalizada no cálculo
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {!somaValida && somaPesos > 0 && (
              <button
                type="button"
                onClick={normalizarPesos}
                className="text-xs px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-medium flex items-center space-x-1.5 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Normalizar para 100%</span>
              </button>
            )}
            {onSalvarPesos && (
              <button
                type="button"
                data-testid="salvar-pesos-padrao"
                disabled={!somaValida}
                onClick={() => onSalvarPesos(pesos)}
                title={somaValida ? 'Gravar estes pesos como padrão da plataforma' : 'A soma dos pesos deve ser 1,0 para salvar'}
                className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-medium flex items-center space-x-1.5 transition-colors disabled:opacity-40"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Salvar como padrão</span>
              </button>
            )}
          </div>
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
                    aria-label={`Peso do critério ${c.codigo} — ${c.nome}`}
                    data-testid={`peso-${c.codigo}`}
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
                  const b = municipios.filter(ehBenchmark).map(m => m.id);
                  if (b.length >= MINIMO_ALTERNATIVAS) setMunicipiosSelecionados(b);
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
                  aria-pressed={checked}
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
            data-testid="executar-topsis"
            disabled={carregando || somaPesos <= 0 || municipiosSelecionados.length < MINIMO_ALTERNATIVAS}
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
