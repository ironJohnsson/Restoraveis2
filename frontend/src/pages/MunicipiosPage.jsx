import React, { useRef, useState } from 'react';
import { Plus, Search, Trash2, Pencil, Upload, Download, Globe } from 'lucide-react';
import Mensagem from '../components/Mensagem';
import { useAuth } from '../hooks/useAuth';
import { useMensagem } from '../hooks/useMensagem';
import { api } from '../services/api';
import { baixarBlob } from '../utils/download';
import { formatarNumero, numeroOuNulo } from '../utils/formato';

const FORM_VAZIO = {
  id: null,
  nome: '',
  uf: 'BA',
  codigoIbge: '',
  populacao: '',
  idh: '',
  latitude: '',
  longitude: '',
  indicadores: {}
};

function paraFormulario(municipio) {
  const indicadores = {};
  Object.entries(municipio.indicadores || {}).forEach(([codigo, valor]) => {
    indicadores[codigo] = String(valor);
  });
  return {
    id: municipio.id,
    nome: municipio.nome,
    uf: municipio.uf,
    codigoIbge: municipio.codigo_ibge || '',
    populacao: municipio.populacao ?? '',
    idh: municipio.idh ?? '',
    latitude: municipio.latitude,
    longitude: municipio.longitude,
    indicadores
  };
}

/** Texto digitado no modal -> corpo da API. Lança Error com mensagem amigável se houver número inválido. */
function paraApi(form, criterios, edicao) {
  const numero = (texto, rotulo) => {
    const valor = numeroOuNulo(texto);
    if (Number.isNaN(valor)) throw new Error(`Valor numérico inválido em "${rotulo}"`);
    return valor;
  };

  const indicadores = {};
  criterios.forEach((c) => {
    const valor = numero(form.indicadores[c.codigo], c.codigo);
    // Na edição, campo vazio remove o dado; no cadastro, simplesmente não é enviado
    if (valor !== null || edicao) indicadores[c.codigo] = valor;
  });

  return {
    nome: form.nome.trim(),
    uf: form.uf.trim().toUpperCase(),
    codigoIbge: String(form.codigoIbge).trim() || null,
    populacao: numero(form.populacao, 'População'),
    idh: numero(form.idh, 'IDH'),
    latitude: numero(form.latitude, 'Latitude'),
    longitude: numero(form.longitude, 'Longitude'),
    indicadores
  };
}

/** RF01 (cadastro e manutenção de municípios) e RF09 (IBGE, ViaCEP e importação de CSV). */
export default function MunicipiosPage({ municipios = [], criterios = [], onAtualizarDados }) {
  const { pode } = useAuth();
  const admin = pode('admin');
  const retorno = useMensagem(10000);

  const [busca, setBusca] = useState('');
  const [form, setForm] = useState(null);
  const [erroForm, setErroForm] = useState(null);
  const [salvando, setSalvando] = useState(false);

  // Busca em fontes externas (IBGE / ViaCEP)
  const [termoIbge, setTermoIbge] = useState('');
  const [sugestoes, setSugestoes] = useState([]);
  const [consultando, setConsultando] = useState(false);
  const [avisoIbge, setAvisoIbge] = useState(null);

  // Importação de CSV
  const arquivoRef = useRef(null);
  const [resultadoImportacao, setResultadoImportacao] = useState(null);
  const [importando, setImportando] = useState(false);

  const termo = busca.trim().toLowerCase();
  const filtrados = municipios.filter(m =>
    m.nome.toLowerCase().includes(termo) ||
    m.uf.toLowerCase().includes(termo) ||
    (m.codigo_ibge || '').includes(termo)
  );

  const abrirModal = (dados) => {
    setErroForm(null);
    setAvisoIbge(null);
    setSugestoes([]);
    setTermoIbge('');
    setForm(dados);
  };

  const handleSalvar = async (e) => {
    e.preventDefault();
    setErroForm(null);

    let corpo;
    try {
      corpo = paraApi(form, criterios, Boolean(form.id));
    } catch (err) {
      setErroForm(err.message);
      return;
    }
    if (!corpo.nome || !corpo.uf || corpo.latitude === null || corpo.longitude === null) {
      setErroForm('Preencha os campos obrigatórios: Nome, UF, Latitude e Longitude.');
      return;
    }

    setSalvando(true);
    try {
      if (form.id) {
        await api.updateMunicipio(form.id, corpo);
        retorno.sucesso('Município atualizado com sucesso!');
      } else {
        await api.createMunicipio(corpo);
        retorno.sucesso('Município cadastrado com sucesso!');
      }
      setForm(null);
      if (onAtualizarDados) await onAtualizarDados();
    } catch (err) {
      setErroForm(err.message);
    } finally {
      setSalvando(false);
    }
  };

  const handleDeletar = async (id, nome) => {
    if (!window.confirm(`Deseja realmente remover o município "${nome}"?\n\nOs indicadores e os resultados dele em simulações anteriores também serão removidos.`)) return;
    try {
      await api.deleteMunicipio(id);
      retorno.sucesso('Município removido com sucesso.');
      if (onAtualizarDados) await onAtualizarDados();
    } catch (err) {
      retorno.erro(err.message);
    }
  };

  /** Preenche o formulário com os dados oficiais (nome, UF, população do Censo 2022 e centroide). */
  const aplicarDadosIbge = (dados) => {
    setForm(atual => ({
      ...atual,
      nome: dados.nome || atual.nome,
      uf: dados.uf || atual.uf,
      codigoIbge: dados.codigoIbge || atual.codigoIbge,
      populacao: dados.populacao ?? atual.populacao,
      latitude: dados.latitude ?? atual.latitude,
      longitude: dados.longitude ?? atual.longitude
    }));
    setSugestoes([]);
    setAvisoIbge({ tipo: 'sucesso', texto: `Dados de ${dados.nome} (${dados.uf}) preenchidos a partir do IBGE. Confira antes de salvar.` });
  };

  /** Aceita código IBGE (7 dígitos), CEP (8 dígitos) ou parte do nome (pesquisa na UF do formulário). */
  const consultarFonteExterna = async () => {
    const texto = termoIbge.trim();
    const digitos = texto.replace(/\D/g, '');
    setAvisoIbge(null);
    setSugestoes([]);
    setConsultando(true);
    try {
      if (/^\d{7}$/.test(texto)) {
        aplicarDadosIbge((await api.getMunicipioIbge(texto)).dados);
      } else if (digitos.length === 8 && /^[\d.\-\s]+$/.test(texto)) {
        aplicarDadosIbge((await api.getMunicipioPorCep(digitos)).dados);
      } else if (texto.length >= 2) {
        const res = await api.pesquisarIbge(form.uf, texto);
        if (res.dados.length === 0) {
          setAvisoIbge({ tipo: 'erro', texto: `Nenhum município encontrado em ${form.uf} para "${texto}".` });
        }
        setSugestoes(res.dados);
      } else {
        setAvisoIbge({ tipo: 'erro', texto: 'Informe o código IBGE (7 dígitos), um CEP ou ao menos 2 letras do nome.' });
      }
    } catch (err) {
      setAvisoIbge({ tipo: 'erro', texto: err.message });
    } finally {
      setConsultando(false);
    }
  };

  const escolherSugestao = async (sugestao) => {
    setConsultando(true);
    try {
      aplicarDadosIbge((await api.getMunicipioIbge(sugestao.codigoIbge)).dados);
    } catch (err) {
      setAvisoIbge({ tipo: 'erro', texto: err.message });
    } finally {
      setConsultando(false);
    }
  };

  const handleImportar = async (e) => {
    const arquivo = e.target.files && e.target.files[0];
    if (!arquivo) return;
    setResultadoImportacao(null);
    setImportando(true);
    try {
      const res = await api.importarMunicipiosCsv(await arquivo.text());
      setResultadoImportacao(res);
      if (onAtualizarDados) await onAtualizarDados();
    } catch (err) {
      retorno.erro(err.message);
    } finally {
      setImportando(false);
      if (arquivoRef.current) arquivoRef.current.value = '';
    }
  };

  const baixarModelo = async () => {
    try {
      baixarBlob(await api.baixarModeloCsv(), 'modelo_importacao_municipios.csv');
    } catch (err) {
      retorno.erro(err.message);
    }
  };

  return (
    <div className="space-y-6">

      {/* Topo com Ações */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold text-slate-900 font-serif">
              Gestão de Municípios e Alternativas
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
              RF01 & RF09
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Cadastro, consulta e manutenção das alternativas e dos indicadores da matriz de decisão.
            {!admin && ' Seu perfil permite apenas consulta.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              aria-label="Buscar município"
              placeholder="Buscar município..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-emerald-500 w-48"
            />
          </div>

          {admin && (
            <>
              <button
                type="button"
                onClick={baixarModelo}
                title="Baixar o modelo de planilha CSV"
                className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs border border-slate-200"
              >
                <Download className="w-4 h-4" />
                <span>Modelo CSV</span>
              </button>
              <button
                type="button"
                onClick={() => arquivoRef.current && arquivoRef.current.click()}
                disabled={importando}
                className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs disabled:opacity-50"
              >
                <Upload className="w-4 h-4" />
                <span>{importando ? 'Importando...' : 'Importar CSV'}</span>
              </button>
              <input
                ref={arquivoRef}
                type="file"
                accept=".csv,text/csv"
                data-testid="arquivo-csv"
                onChange={handleImportar}
                className="hidden"
              />
              <button
                type="button"
                data-testid="novo-municipio"
                onClick={() => abrirModal(FORM_VAZIO)}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Novo Município</span>
              </button>
            </>
          )}
        </div>
      </div>

      <Mensagem mensagem={retorno.mensagem} />

      {resultadoImportacao && (
        <div data-testid="resultado-importacao" className="p-4 rounded-2xl border border-slate-200 bg-white text-xs space-y-2">
          <div className="flex items-center justify-between">
            <strong className="text-slate-900">{resultadoImportacao.mensagem}</strong>
            <button type="button" onClick={() => setResultadoImportacao(null)} className="text-slate-400 hover:text-slate-700 font-semibold">Fechar</button>
          </div>
          {resultadoImportacao.colunasIgnoradas.length > 0 && (
            <p className="text-slate-500">Colunas não reconhecidas (ignoradas): {resultadoImportacao.colunasIgnoradas.join(', ')}</p>
          )}
          {resultadoImportacao.erros.length > 0 && (
            <ul className="text-rose-700 max-h-32 overflow-y-auto space-y-0.5">
              {resultadoImportacao.erros.map(erro => (
                <li key={erro.linha}>Linha {erro.linha}: {erro.mensagem}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Tabela de Municípios e Indicadores */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs" data-testid="tabela-municipios">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold text-[11px]">
                <th className="py-3 px-4">Município</th>
                <th className="py-3 px-4">UF</th>
                <th className="py-3 px-4">Cód. IBGE</th>
                <th className="py-3 px-4">População</th>
                <th className="py-3 px-4">IDH</th>
                <th className="py-3 px-4">Coordenadas</th>
                {criterios.map(c => (
                  <th key={c.codigo} className="py-3 px-3 text-center" title={`${c.nome}${c.unidade ? ` (${c.unidade})` : ''}`}>
                    {c.codigo}
                  </th>
                ))}
                {admin && <th className="py-3 px-4 text-center">Ações</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtrados.map((m) => (
                <tr key={m.id} data-testid="linha-municipio" className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-900">
                    {m.nome}
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-600">
                    {m.uf}
                  </td>
                  <td className="py-3 px-4 text-slate-500 font-mono">
                    {m.codigo_ibge || '-'}
                  </td>
                  <td className="py-3 px-4 text-slate-600 font-mono">
                    {formatarNumero(m.populacao)}
                  </td>
                  <td className="py-3 px-4 text-slate-600 font-mono">
                    {formatarNumero(m.idh, 3)}
                  </td>
                  <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                    {parseFloat(m.latitude).toFixed(3)}, {parseFloat(m.longitude).toFixed(3)}
                  </td>
                  {criterios.map((c) => {
                    const valor = m.indicadores ? m.indicadores[c.codigo] : undefined;
                    const ausente = valor === undefined || valor === null;
                    return (
                      <td
                        key={c.codigo}
                        title={ausente ? `Sem dado para ${c.codigo}` : undefined}
                        className={`py-3 px-3 text-center font-mono font-medium ${ausente ? 'text-amber-600 bg-amber-50/60' : 'text-slate-700'}`}
                      >
                        {ausente ? '—' : valor}
                      </td>
                    );
                  })}
                  {admin && (
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center space-x-1">
                        <button
                          type="button"
                          onClick={() => abrirModal(paraFormulario(m))}
                          className="p-1 rounded-lg text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                          title="Editar município"
                          aria-label={`Editar ${m.nome}`}
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeletar(m.id, m.nome)}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Excluir município"
                          aria-label={`Excluir ${m.nome}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {filtrados.length === 0 && (
                <tr>
                  <td colSpan={7 + criterios.length} className="py-8 text-center text-slate-400">
                    Nenhum município encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Cadastro / Edição */}
      {form && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-[1000]">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-xl border border-slate-200 max-h-[92vh] overflow-y-auto">
            <h3 className="font-bold text-slate-900 text-lg font-serif mb-1">
              {form.id ? 'Editar Município' : 'Cadastrar Novo Município'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Informe os dados cadastrais e os valores dos critérios. Indicadores em branco ficam sem dado
              (o município só entra em simulações cujos critérios ponderados estejam preenchidos).
            </p>

            {/* Busca por CEP / IBGE */}
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 mb-4">
              <label htmlFor="busca-ibge" className="flex items-center space-x-1.5 text-xs font-bold text-slate-700 mb-1.5">
                <Globe className="w-3.5 h-3.5 text-emerald-600" />
                <span>Preencher com dados do IBGE</span>
              </label>
              <div className="flex gap-2">
                <input
                  id="busca-ibge"
                  type="text"
                  value={termoIbge}
                  onChange={e => setTermoIbge(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); consultarFonteExterna(); } }}
                  className="flex-1 px-3 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500"
                  placeholder="Código IBGE (7 dígitos), CEP ou nome do município"
                />
                <button
                  type="button"
                  data-testid="buscar-ibge"
                  onClick={consultarFonteExterna}
                  disabled={consultando}
                  className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs disabled:opacity-50"
                >
                  {consultando ? 'Buscando...' : 'Buscar'}
                </button>
              </div>
              {sugestoes.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5" data-testid="sugestoes-ibge">
                  {sugestoes.map(s => (
                    <button
                      key={s.codigoIbge}
                      type="button"
                      onClick={() => escolherSugestao(s)}
                      className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-emerald-400 text-xs text-slate-700"
                    >
                      {s.nome} <span className="text-slate-400 font-mono">{s.codigoIbge}</span>
                    </button>
                  ))}
                </div>
              )}
              {avisoIbge && (
                <p role="status" className={`mt-2 text-[11px] font-semibold ${avisoIbge.tipo === 'sucesso' ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {avisoIbge.texto}
                </p>
              )}
            </div>

            <form onSubmit={handleSalvar} className="space-y-4" data-testid="form-municipio" noValidate>
              <div className="grid grid-cols-6 gap-3">
                <div className="col-span-6 sm:col-span-3">
                  <label htmlFor="mun-nome" className="block text-xs font-semibold text-slate-700 mb-1">Nome do Município *</label>
                  <input
                    id="mun-nome"
                    type="text"
                    required
                    maxLength={200}
                    value={form.nome}
                    onChange={e => setForm({ ...form, nome: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500"
                    placeholder="Ex: Irecê"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label htmlFor="mun-uf" className="block text-xs font-semibold text-slate-700 mb-1">UF *</label>
                  <input
                    id="mun-uf"
                    type="text"
                    required
                    maxLength={2}
                    value={form.uf}
                    onChange={e => setForm({ ...form, uf: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500 uppercase"
                    placeholder="BA"
                  />
                </div>
                <div className="col-span-4 sm:col-span-2">
                  <label htmlFor="mun-ibge" className="block text-xs font-semibold text-slate-700 mb-1">Código IBGE</label>
                  <input
                    id="mun-ibge"
                    type="text"
                    inputMode="numeric"
                    maxLength={7}
                    value={form.codigoIbge}
                    onChange={e => setForm({ ...form, codigoIbge: e.target.value.replace(/\D/g, '') })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:border-emerald-500"
                    placeholder="2914604"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label htmlFor="mun-populacao" className="block text-xs font-semibold text-slate-700 mb-1">População</label>
                  <input
                    id="mun-populacao"
                    type="number"
                    min="0"
                    step="1"
                    value={form.populacao}
                    onChange={e => setForm({ ...form, populacao: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500"
                    placeholder="74507"
                  />
                </div>
                <div>
                  <label htmlFor="mun-idh" className="block text-xs font-semibold text-slate-700 mb-1">IDH (0 a 1)</label>
                  <input
                    id="mun-idh"
                    type="number"
                    min="0"
                    max="1"
                    step="0.001"
                    value={form.idh}
                    onChange={e => setForm({ ...form, idh: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500"
                    placeholder="0.691"
                  />
                </div>
                <div>
                  <label htmlFor="mun-latitude" className="block text-xs font-semibold text-slate-700 mb-1">Latitude *</label>
                  <input
                    id="mun-latitude"
                    type="number"
                    min="-90"
                    max="90"
                    step="any"
                    required
                    value={form.latitude}
                    onChange={e => setForm({ ...form, latitude: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500"
                    placeholder="-11.3094"
                  />
                </div>
                <div>
                  <label htmlFor="mun-longitude" className="block text-xs font-semibold text-slate-700 mb-1">Longitude *</label>
                  <input
                    id="mun-longitude"
                    type="number"
                    min="-180"
                    max="180"
                    step="any"
                    required
                    value={form.longitude}
                    onChange={e => setForm({ ...form, longitude: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500"
                    placeholder="-41.839"
                  />
                </div>
              </div>

              {/* Indicadores (um campo por critério cadastrado) */}
              <div className="pt-2 border-t border-slate-100">
                <span className="block text-xs font-bold text-slate-700 mb-2">Valores dos Indicadores:</span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {criterios.map(c => (
                    <div key={c.codigo}>
                      <label htmlFor={`ind-${c.codigo}`} className="block text-[11px] text-slate-500 line-clamp-1" title={c.nome}>
                        {c.codigo} — {c.nome}{c.unidade ? ` (${c.unidade})` : ''}
                      </label>
                      <input
                        id={`ind-${c.codigo}`}
                        type="number"
                        min="0"
                        step="any"
                        value={form.indicadores[c.codigo] ?? ''}
                        onChange={e => setForm({
                          ...form,
                          indicadores: { ...form.indicadores, [c.codigo]: e.target.value }
                        })}
                        className="w-full px-2 py-1 border border-slate-200 rounded-lg text-xs font-mono"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {erroForm && (
                <p role="alert" data-testid="erro-municipio" className="text-xs font-semibold text-rose-700">{erroForm}</p>
              )}

              <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setForm(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm disabled:opacity-50"
                >
                  {salvando ? 'Salvando...' : 'Salvar Município'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
