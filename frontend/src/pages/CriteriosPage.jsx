import React, { useEffect, useState } from 'react';
import { Plus, Save, Trash2, RotateCcw, Check, AlertCircle } from 'lucide-react';
import Mensagem from '../components/Mensagem';
import { useAuth } from '../hooks/useAuth';
import { useMensagem } from '../hooks/useMensagem';
import { api } from '../services/api';

const NOVO_CRITERIO = { nome: '', tipo: 'beneficio', unidade: '', fonte: '', descricao: '' };

/**
 * UC02 — Configurar Critérios TOPSIS (RF02 e RF03): tabela editável com tipo
 * (benefício/custo), unidade, fonte e slider de peso. A soma dos pesos deve ser 1,0.
 */
export default function CriteriosPage({ criterios = [], onAtualizarDados }) {
  const { pode } = useAuth();
  const podeEditar = pode('admin', 'pesquisador');
  const retorno = useMensagem();

  const [linhas, setLinhas] = useState([]);
  const [novo, setNovo] = useState(NOVO_CRITERIO);
  const [formularioAberto, setFormularioAberto] = useState(false);
  const [salvando, setSalvando] = useState(false);

  // Cópia editável dos critérios; recarregada sempre que os dados do servidor mudam
  useEffect(() => {
    setLinhas(criterios.map(c => ({
      ...c,
      peso: Number(c.peso) || 0,
      unidade: c.unidade || '',
      fonte: c.fonte || ''
    })));
  }, [criterios]);

  const editar = (id, campo, valor) => {
    setLinhas(atual => atual.map(l => (l.id === id ? { ...l, [campo]: valor } : l)));
  };

  const somaPesos = linhas.reduce((soma, l) => soma + (Number(l.peso) || 0), 0);
  const somaValida = Math.abs(somaPesos - 1) <= 0.001;

  const original = id => criterios.find(c => c.id === id) || {};
  const dadosAlterados = l => {
    const o = original(l.id);
    return l.nome !== o.nome || l.tipo !== o.tipo || l.unidade !== (o.unidade || '') || l.fonte !== (o.fonte || '');
  };
  const pesosAlterados = linhas.some(l => Math.abs(l.peso - (Number(original(l.id).peso) || 0)) > 1e-9);

  const normalizar = () => {
    if (somaPesos <= 0) return;
    setLinhas(atual => atual.map(l => ({ ...l, peso: Number((l.peso / somaPesos).toFixed(4)) })));
  };

  const executar = async (operacao, mensagemSucesso) => {
    setSalvando(true);
    try {
      await operacao();
      retorno.sucesso(mensagemSucesso);
      if (onAtualizarDados) await onAtualizarDados();
      return true;
    } catch (err) {
      retorno.erro(err.message);
      return false;
    } finally {
      setSalvando(false);
    }
  };

  const salvarDados = (linha) => executar(
    () => api.updateCriterio(linha.id, { nome: linha.nome, tipo: linha.tipo, unidade: linha.unidade, fonte: linha.fonte }),
    `Critério ${linha.codigo} atualizado.`
  );

  const salvarPesos = () => executar(
    () => api.updatePesos(Object.fromEntries(linhas.map(l => [l.codigo, l.peso]))),
    'Pesos atualizados com sucesso.'
  );

  const excluir = (linha) => {
    if (!window.confirm(
      `Excluir o critério ${linha.codigo} — ${linha.nome}?\n\n` +
      'Os valores deste critério em todos os municípios serão apagados e o seu peso será redistribuído entre os demais.'
    )) return;
    executar(() => api.deleteCriterio(linha.id), `Critério ${linha.codigo} excluído.`);
  };

  const criar = async (e) => {
    e.preventDefault();
    const ok = await executar(
      () => api.createCriterio(novo),
      'Critério cadastrado com peso 0. Informe os valores nos municípios e ajuste os pesos.'
    );
    if (ok) {
      setNovo(NOVO_CRITERIO);
      setFormularioAberto(false);
    }
  };

  return (
    <div className="space-y-6">

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold text-slate-900 font-serif">Critérios e Pesos do TOPSIS</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">RF02 & RF03</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Indicadores de vulnerabilidade, seu tipo (benefício: quanto maior, melhor; custo: quanto menor, melhor) e os pesos padrão das simulações.
            {!podeEditar && ' Seu perfil permite apenas consulta.'}
          </p>
        </div>

        {podeEditar && (
          <button
            type="button"
            data-testid="novo-criterio"
            onClick={() => setFormularioAberto(aberto => !aberto)}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Critério</span>
          </button>
        )}
      </div>

      <Mensagem mensagem={retorno.mensagem} />

      {formularioAberto && podeEditar && (
        <form onSubmit={criar} className="bg-white rounded-2xl border border-emerald-200 shadow-sm p-6 space-y-4" data-testid="form-criterio">
          <h3 className="font-bold text-slate-900 text-base font-serif">Cadastrar critério</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="md:col-span-2">
              <label htmlFor="criterio-nome" className="block text-xs font-semibold text-slate-700 mb-1">Nome do indicador *</label>
              <input id="criterio-nome" required maxLength={150} value={novo.nome}
                onChange={e => setNovo({ ...novo, nome: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500"
                placeholder="Ex: Consumo médio residencial" />
            </div>
            <div>
              <label htmlFor="criterio-tipo" className="block text-xs font-semibold text-slate-700 mb-1">Tipo *</label>
              <select id="criterio-tipo" value={novo.tipo} onChange={e => setNovo({ ...novo, tipo: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs bg-white">
                <option value="beneficio">Benefício (maior é melhor)</option>
                <option value="custo">Custo (menor é melhor)</option>
              </select>
            </div>
            <div>
              <label htmlFor="criterio-unidade" className="block text-xs font-semibold text-slate-700 mb-1">Unidade</label>
              <input id="criterio-unidade" maxLength={50} value={novo.unidade}
                onChange={e => setNovo({ ...novo, unidade: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500"
                placeholder="kWh/mês" />
            </div>
            <div>
              <label htmlFor="criterio-fonte" className="block text-xs font-semibold text-slate-700 mb-1">Fonte</label>
              <input id="criterio-fonte" maxLength={100} value={novo.fonte}
                onChange={e => setNovo({ ...novo, fonte: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500"
                placeholder="IBGE, ANEEL, INPE..." />
            </div>
            <div className="md:col-span-3">
              <label htmlFor="criterio-descricao" className="block text-xs font-semibold text-slate-700 mb-1">Descrição</label>
              <input id="criterio-descricao" maxLength={1000} value={novo.descricao}
                onChange={e => setNovo({ ...novo, descricao: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500" />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <button type="button" onClick={() => setFormularioAberto(false)} className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100">
              Cancelar
            </button>
            <button type="submit" disabled={salvando} className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs disabled:opacity-50">
              Salvar Critério
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Barra da soma dos pesos */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50">
          <div className="flex items-center space-x-2 text-xs">
            <span className="font-semibold text-slate-700">Soma dos pesos:</span>
            <span data-testid="soma-pesos-criterios" className={`font-mono font-bold px-2 py-0.5 rounded-md border ${
              somaValida ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-amber-100 text-amber-800 border-amber-200'
            }`}>
              {somaPesos.toFixed(4)}
            </span>
            {somaValida ? (
              <span className="text-emerald-600 flex items-center"><Check className="w-3.5 h-3.5 mr-1" /> Soma = 1,0</span>
            ) : (
              <span className="text-amber-700 flex items-center"><AlertCircle className="w-3.5 h-3.5 mr-1" /> A soma precisa ser 1,0 para salvar</span>
            )}
          </div>
          {podeEditar && (
            <div className="flex items-center gap-2">
              {!somaValida && somaPesos > 0 && (
                <button type="button" onClick={normalizar}
                  className="text-xs px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-medium flex items-center space-x-1.5">
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Normalizar</span>
                </button>
              )}
              <button type="button" data-testid="salvar-pesos" onClick={salvarPesos}
                disabled={!somaValida || !pesosAlterados || salvando}
                className="text-xs px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium flex items-center space-x-1.5 disabled:opacity-40">
                <Save className="w-3.5 h-3.5" />
                <span>Salvar pesos</span>
              </button>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs" data-testid="tabela-criterios">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold text-[11px]">
                <th className="py-3 px-4">Cód</th>
                <th className="py-3 px-4">Indicador</th>
                <th className="py-3 px-4">Tipo</th>
                <th className="py-3 px-4">Unidade</th>
                <th className="py-3 px-4">Fonte</th>
                <th className="py-3 px-4 w-64">Peso</th>
                {podeEditar && <th className="py-3 px-4 text-center">Ações</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {linhas.map(l => (
                <tr key={l.id} data-testid={`criterio-${l.codigo}`} className="hover:bg-slate-50/60">
                  <td className="py-2.5 px-4 font-mono font-bold text-slate-900">{l.codigo}</td>
                  <td className="py-2.5 px-4 min-w-[220px]">
                    <input aria-label={`Nome do critério ${l.codigo}`} value={l.nome} disabled={!podeEditar} maxLength={150}
                      onChange={e => editar(l.id, 'nome', e.target.value)}
                      className="w-full px-2 py-1 border border-slate-200 rounded-lg text-xs disabled:bg-transparent disabled:border-transparent" />
                  </td>
                  <td className="py-2.5 px-4">
                    <select aria-label={`Tipo do critério ${l.codigo}`} value={l.tipo} disabled={!podeEditar}
                      onChange={e => editar(l.id, 'tipo', e.target.value)}
                      className={`px-2 py-1 border rounded-lg text-xs font-semibold disabled:opacity-100 ${
                        l.tipo === 'beneficio' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}>
                      <option value="beneficio">↑ Benefício</option>
                      <option value="custo">↓ Custo</option>
                    </select>
                  </td>
                  <td className="py-2.5 px-4">
                    <input aria-label={`Unidade do critério ${l.codigo}`} value={l.unidade} disabled={!podeEditar} maxLength={50}
                      onChange={e => editar(l.id, 'unidade', e.target.value)}
                      className="w-24 px-2 py-1 border border-slate-200 rounded-lg text-xs disabled:bg-transparent disabled:border-transparent" />
                  </td>
                  <td className="py-2.5 px-4">
                    <input aria-label={`Fonte do critério ${l.codigo}`} value={l.fonte} disabled={!podeEditar} maxLength={100}
                      onChange={e => editar(l.id, 'fonte', e.target.value)}
                      className="w-24 px-2 py-1 border border-slate-200 rounded-lg text-xs disabled:bg-transparent disabled:border-transparent" />
                  </td>
                  <td className="py-2.5 px-4">
                    <div className="flex items-center space-x-3">
                      <input type="range" min="0" max="1" step="0.01" value={l.peso} disabled={!podeEditar}
                        aria-label={`Peso do critério ${l.codigo}`}
                        onChange={e => editar(l.id, 'peso', parseFloat(e.target.value))}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600" />
                      <input type="number" min="0" max="1" step="0.01" value={l.peso} disabled={!podeEditar}
                        aria-label={`Peso numérico do critério ${l.codigo}`}
                        data-testid={`peso-criterio-${l.codigo}`}
                        onChange={e => editar(l.id, 'peso', Math.min(Math.max(parseFloat(e.target.value) || 0, 0), 1))}
                        className="w-20 px-2 py-1 border border-slate-200 rounded-lg text-xs font-mono text-right" />
                    </div>
                  </td>
                  {podeEditar && (
                    <td className="py-2.5 px-4">
                      <div className="flex items-center justify-center space-x-1">
                        <button type="button" onClick={() => salvarDados(l)} disabled={!dadosAlterados(l) || salvando || !l.nome.trim()}
                          title="Salvar alterações deste critério" aria-label={`Salvar critério ${l.codigo}`}
                          className="p-1.5 rounded-lg text-emerald-700 hover:bg-emerald-50 disabled:opacity-30 disabled:hover:bg-transparent">
                          <Save className="w-4 h-4" />
                        </button>
                        <button type="button" onClick={() => excluir(l)} disabled={salvando || linhas.length <= 1}
                          title="Excluir critério" aria-label={`Excluir critério ${l.codigo}`}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 disabled:opacity-30">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
