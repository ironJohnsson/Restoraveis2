import React, { useState } from 'react';
import { Plus, Search, Building2, Trash2, MapPin, Check, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

export default function MunicipiosPage({ municipios = [], criterios = [], onAtualizarDados }) {
  const [busca, setBusca] = useState('');
  const [modalAberto, setModalAberto] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [mensagem, setMensagem] = useState(null);

  // Estado do formulário de novo município
  const [form, setForm] = useState({
    nome: '',
    uf: 'BA',
    populacao: '',
    idh: '',
    latitude: '',
    longitude: '',
    indicadores: {
      C1: 5.0,
      C2: 2.0,
      C3: 1200,
      C4: 0.75,
      C5: 5.5,
      C6: 15.0,
      C7: 5
    }
  });

  const filtrados = municipios.filter(m =>
    m.nome.toLowerCase().includes(busca.toLowerCase()) ||
    m.uf.toLowerCase().includes(busca.toLowerCase())
  );

  const handleSalvar = async (e) => {
    e.preventDefault();
    if (!form.nome || !form.uf || !form.latitude || !form.longitude) {
      alert('Preencha os campos obrigatórios (Nome, UF, Latitude e Longitude).');
      return;
    }

    try {
      setCarregando(true);
      const res = await api.createMunicipio({
        ...form,
        populacao: form.populacao ? parseInt(form.populacao, 10) : null,
        idh: form.idh ? parseFloat(form.idh) : null,
        latitude: parseFloat(form.latitude),
        longitude: parseFloat(form.longitude)
      });

      if (res.sucesso) {
        setMensagem({ tipo: 'sucesso', texto: 'Município cadastrado com sucesso!' });
        setModalAberto(false);
        setForm({
          nome: '',
          uf: 'BA',
          populacao: '',
          idh: '',
          latitude: '',
          longitude: '',
          indicadores: { C1: 5.0, C2: 2.0, C3: 1200, C4: 0.75, C5: 5.5, C6: 15.0, C7: 5 }
        });
        if (onAtualizarDados) onAtualizarDados();
      } else {
        setMensagem({ tipo: 'erro', texto: res.mensagem });
      }
    } catch (err) {
      setMensagem({ tipo: 'erro', texto: 'Erro de conexão com a API' });
    } finally {
      setCarregando(false);
      setTimeout(() => setMensagem(null), 4000);
    }
  };

  const handleDeletar = async (id, nome) => {
    if (!confirm(`Deseja realmente remover o município "${nome}"?`)) return;
    try {
      await api.deleteMunicipio(id);
      if (onAtualizarDados) onAtualizarDados();
    } catch (err) {
      alert('Erro ao excluir município.');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Topo com Ações */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold text-slate-900 font-serif">
              Gestão de Municípios e Alternativas
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
              RF01
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Cadastro, consulta e manutenção das alternativas e dados socioeconômicos da matriz de decisão.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar município..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-emerald-500 w-48"
            />
          </div>

          <button
            onClick={() => setModalAberto(true)}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Município</span>
          </button>
        </div>
      </div>

      {mensagem && (
        <div className={`p-4 rounded-xl border text-xs font-semibold flex items-center space-x-2 ${
          mensagem.tipo === 'sucesso' 
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
            : 'bg-rose-50 text-rose-800 border-rose-200'
        }`}>
          {mensagem.tipo === 'sucesso' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{mensagem.texto}</span>
        </div>
      )}

      {/* Tabela de Municípios e Indicadores */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold text-[11px]">
                <th className="py-3 px-4">Município</th>
                <th className="py-3 px-4">UF</th>
                <th className="py-3 px-4">População</th>
                <th className="py-3 px-4">IDH</th>
                <th className="py-3 px-4">Coordenadas</th>
                {criterios.map(c => (
                  <th key={c.codigo} className="py-3 px-3 text-center" title={`${c.nome} (${c.unidade})`}>
                    {c.codigo}
                  </th>
                ))}
                <th className="py-3 px-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtrados.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-900">
                    {m.nome}
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-600">
                    {m.uf}
                  </td>
                  <td className="py-3 px-4 text-slate-600 font-mono">
                    {m.populacao ? m.populacao.toLocaleString('pt-BR') : '-'}
                  </td>
                  <td className="py-3 px-4 text-slate-600 font-mono">
                    {m.idh ? m.idh.toFixed(3) : '-'}
                  </td>
                  <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                    {parseFloat(m.latitude).toFixed(3)}, {parseFloat(m.longitude).toFixed(3)}
                  </td>
                  {criterios.map(c => (
                    <td key={c.codigo} className="py-3 px-3 text-center font-mono font-medium text-slate-700">
                      {m.indicadores && m.indicadores[c.codigo] !== undefined 
                        ? m.indicadores[c.codigo] 
                        : '-'}
                    </td>
                  ))}
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => handleDeletar(m.id, m.nome)}
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Excluir município"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Cadastro de Novo Município */}
      {modalAberto && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-xl border border-slate-200">
            <h3 className="font-bold text-slate-900 text-lg font-serif mb-1">
              Cadastrar Novo Município
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Informe os dados cadastrais e os valores para os critérios de vulnerabilidade energética.
            </p>

            <form onSubmit={handleSalvar} className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nome do Município *</label>
                  <input
                    type="text"
                    required
                    value={form.nome}
                    onChange={e => setForm({ ...form, nome: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500"
                    placeholder="Ex: Irecê"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">UF *</label>
                  <input
                    type="text"
                    required
                    maxLength={2}
                    value={form.uf}
                    onChange={e => setForm({ ...form, uf: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500 uppercase"
                    placeholder="BA"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">População</label>
                  <input
                    type="number"
                    value={form.populacao}
                    onChange={e => setForm({ ...form, populacao: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500"
                    placeholder="Ex: 75000"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">IDH</label>
                  <input
                    type="number"
                    step="0.001"
                    value={form.idh}
                    onChange={e => setForm({ ...form, idh: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500"
                    placeholder="Ex: 0.690"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Latitude *</label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={form.latitude}
                    onChange={e => setForm({ ...form, latitude: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500"
                    placeholder="-11.3000"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Longitude *</label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={form.longitude}
                    onChange={e => setForm({ ...form, longitude: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500"
                    placeholder="-41.8500"
                  />
                </div>
              </div>

              {/* Indicadores C1 a C5 */}
              <div className="pt-2 border-t border-slate-100">
                <span className="block text-xs font-bold text-slate-700 mb-2">Valores dos Indicadores:</span>
                <div className="grid grid-cols-3 gap-2">
                  {criterios.map(c => (
                    <div key={c.codigo}>
                      <label className="block text-[11px] text-slate-500 line-clamp-1">{c.codigo} ({c.unidade})</label>
                      <input
                        type="number"
                        step="0.01"
                        value={form.indicadores[c.codigo] || ''}
                        onChange={e => setForm({
                          ...form,
                          indicadores: { ...form.indicadores, [c.codigo]: parseFloat(e.target.value) || 0 }
                        })}
                        className="w-full px-2 py-1 border border-slate-200 rounded-lg text-xs font-mono"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalAberto(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={carregando}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm"
                >
                  {carregando ? 'Salvando...' : 'Salvar Município'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
