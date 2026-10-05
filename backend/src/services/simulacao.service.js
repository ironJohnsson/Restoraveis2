const TopsisService = require('./topsis.service');
const Criterio = require('../models/criterio.model');
const Municipio = require('../models/municipio.model');
const Simulacao = require('../models/simulacao.model');
const HttpError = require('../utils/HttpError');
const { classificar } = require('../utils/classificacao');

const TITULO_PADRAO = 'Simulação TOPSIS de Vulnerabilidade Energética';
const MINIMO_ALTERNATIVAS = 2;

function milissegundosDesde(inicio) {
  return Number((Number(process.hrtime.bigint() - inicio) / 1e6).toFixed(2));
}

function resumir(ranking) {
  if (ranking.length === 0) {
    return { ciMaximo: null, ciMinimo: null, ciMedio: null, municipioMaisVulneravel: null, municipioMenosVulneravel: null };
  }
  const cis = ranking.map(r => r.ci);
  return {
    ciMaximo: Math.max(...cis),
    ciMinimo: Math.min(...cis),
    ciMedio: Number((cis.reduce((a, b) => a + b, 0) / cis.length).toFixed(4)),
    municipioMaisVulneravel: ranking[ranking.length - 1].nome,
    municipioMenosVulneravel: ranking[0].nome
  };
}

/** Seleciona os critérios do cálculo: todos, ou os informados por id ou código. */
function selecionarCriterios(todos, criteriosIds) {
  if (criteriosIds === undefined || criteriosIds === null) return todos;
  if (!Array.isArray(criteriosIds)) {
    throw new HttpError(400, "O campo 'criteriosIds' deve ser uma lista de ids ou códigos de critérios");
  }
  if (criteriosIds.length === 0) return todos;

  const pedidos = criteriosIds.map(c => String(c).toUpperCase());
  const selecionados = todos.filter(c => pedidos.includes(String(c.id)) || pedidos.includes(c.codigo.toUpperCase()));
  const encontrados = new Set(selecionados.flatMap(c => [String(c.id), c.codigo.toUpperCase()]));
  const inexistentes = pedidos.filter(p => !encontrados.has(p));
  if (inexistentes.length > 0) {
    throw new HttpError(400, `Critério(s) inexistente(s): ${inexistentes.join(', ')}`);
  }
  return selecionados;
}

/** Peso de cada critério: o personalizado na requisição (por código ou id) ou o padrão cadastrado. */
function resolverPesos(criterios, pesosPersonalizados) {
  if (pesosPersonalizados !== undefined && pesosPersonalizados !== null &&
      (typeof pesosPersonalizados !== 'object' || Array.isArray(pesosPersonalizados))) {
    throw new HttpError(400, "O campo 'pesosPersonalizados' deve ser um objeto no formato { C1: 0.2, C2: 0.3 }");
  }

  const personalizados = pesosPersonalizados || {};
  const pesos = criterios.map((c) => {
    const informado = personalizados[c.codigo] ?? personalizados[c.id];
    const peso = Number(informado ?? c.peso ?? 0);
    if (informado === '' || typeof informado === 'boolean' || !Number.isFinite(peso) || peso < 0) {
      throw new HttpError(400, `Peso inválido para o critério ${c.codigo}: informe um número maior ou igual a zero`);
    }
    return peso;
  });

  if (pesos.reduce((a, b) => a + b, 0) <= 0) {
    throw new HttpError(400, 'A soma dos pesos deve ser maior que zero');
  }
  return pesos;
}

function selecionarMunicipios(todos, municipioIds) {
  if (municipioIds === undefined || municipioIds === null) return todos;
  if (!Array.isArray(municipioIds)) {
    throw new HttpError(400, "O campo 'municipioIds' deve ser uma lista de ids de municípios");
  }
  if (municipioIds.length === 0) return todos;

  const pedidos = [...new Set(municipioIds.map(Number))];
  const existentes = new Set(todos.map(m => m.id));
  const inexistentes = pedidos.filter(id => !existentes.has(id));
  if (inexistentes.length > 0) {
    throw new HttpError(400, `Município(s) inexistente(s): ${inexistentes.join(', ')}`);
  }
  return todos.filter(m => pedidos.includes(m.id));
}

/**
 * Executa o fluxo completo do caso de uso UC03:
 * monta a matriz de decisão a partir do banco, roda o TOPSIS e persiste a simulação.
 *
 * Um município sem valor em algum critério com peso > 0 NÃO entra no cálculo
 * (tratar o dado ausente como zero o favoreceria nos critérios de custo). Ele é
 * devolvido em `alternativasExcluidas`, com os critérios que faltam.
 */
async function executar(payload = {}, usuario = null) {
  const inicio = process.hrtime.bigint();
  const { municipioIds, criteriosIds, pesosPersonalizados, salvarSimulacao = true } = payload;
  const titulo = (typeof payload.titulo === 'string' && payload.titulo.trim())
    ? payload.titulo.trim().slice(0, 200)
    : TITULO_PADRAO;

  const criterios = selecionarCriterios(await Criterio.listar(), criteriosIds);
  if (criterios.length === 0) {
    throw new HttpError(400, 'Nenhum critério cadastrado para o cálculo');
  }
  const pesos = resolverPesos(criterios, pesosPersonalizados);

  const municipios = selecionarMunicipios(await Municipio.listarCadastro(), municipioIds);

  // municipioId -> criterioId -> valor
  const valores = new Map();
  for (const v of await Municipio.valoresVigentes()) {
    if (!valores.has(v.municipio_id)) valores.set(v.municipio_id, new Map());
    valores.get(v.municipio_id).set(v.criterio_id, v.valor);
  }

  const alternativas = [];
  const matriz = [];
  const alternativasExcluidas = [];
  for (const municipio of municipios) {
    const dados = valores.get(municipio.id) || new Map();
    const linha = criterios.map(c => (dados.has(c.id) ? Number(dados.get(c.id)) : null));
    const semDado = criterios.filter((c, j) => pesos[j] > 0 && linha[j] === null).map(c => c.codigo);

    if (semDado.length > 0) {
      alternativasExcluidas.push({ municipioId: municipio.id, nome: municipio.nome, uf: municipio.uf, criteriosSemDado: semDado });
    } else {
      alternativas.push(municipio);
      matriz.push(linha);
    }
  }

  if (alternativas.length < MINIMO_ALTERNATIVAS) {
    throw new HttpError(
      400,
      `O TOPSIS requer ao menos ${MINIMO_ALTERNATIVAS} alternativas com dados completos nos critérios ponderados ` +
      `(disponíveis: ${alternativas.length})`,
      { alternativasExcluidas }
    );
  }

  const inicioCalculo = process.hrtime.bigint();
  const resultado = TopsisService.executar({ alternativas, criterios, pesos, matriz });
  const tempoCalculoMs = milissegundosDesde(inicioCalculo);

  // Acrescenta o código IBGE de cada município aos itens do ranking
  const codigosIbge = new Map(alternativas.map(a => [a.id, a.codigo_ibge]));
  resultado.ranking.forEach((item) => { item.codigoIbge = codigosIbge.get(item.municipioId) || null; });

  const dataExecucao = new Date().toISOString();
  let simulacaoId = null;

  if (salvarSimulacao) {
    const snapshotValores = {};
    alternativas.forEach((a, i) => { snapshotValores[a.id] = matriz[i]; });

    simulacaoId = await Simulacao.criar({
      usuarioId: usuario ? usuario.id : null,
      titulo,
      dataExecucao,
      parametros: {
        titulo,
        pesosInformados: pesos,
        pesosUtilizados: resultado.pesosUtilizados,
        criterios: resultado.criteriosInfo,
        municipioIds: alternativas.map(a => a.id),
        valores: snapshotValores,
        alternativasExcluidas,
        tempoCalculoMs
      },
      ranking: resultado.ranking
    });
  }

  return {
    simulacaoId,
    titulo,
    dataExecucao,
    usuarioNome: usuario ? usuario.nome : null,
    ...resultado,
    alternativasExcluidas,
    tempoCalculoMs,
    // Tempo total no servidor: leitura do banco + cálculo + gravação (métrica do RNF01)
    tempoExecucaoMs: milissegundosDesde(inicio)
  };
}

/** Histórico (RF10). O snapshot de valores fica de fora da listagem por ser volumoso. */
async function listar({ limite } = {}) {
  const simulacoes = await Simulacao.listar({ limite });
  return simulacoes.map((s) => {
    const { valores, ...parametros } = s.parametros;
    return { ...s, parametros };
  });
}

/**
 * Recupera uma simulação salva no mesmo formato devolvido por `executar`,
 * para que dashboard, mapa e relatórios tratem as duas origens igualmente.
 */
async function obter(id) {
  const simulacao = await Simulacao.buscarPorId(id);
  if (!simulacao) {
    throw new HttpError(404, 'Simulação não encontrada');
  }

  const parametros = simulacao.parametros;
  const snapshotValores = parametros.valores || {};
  const linhas = await Simulacao.resultados(id);

  const ranking = linhas.map((r) => {
    const faixa = classificar(r.coeficiente_ci);
    return {
      municipioId: r.municipio_id,
      nome: r.nome,
      uf: r.uf,
      codigoIbge: r.codigo_ibge || null,
      populacao: r.populacao,
      idh: r.idh,
      latitude: r.latitude,
      longitude: r.longitude,
      ci: r.coeficiente_ci,
      distanciaPositiva: r.distancia_positiva,
      distanciaNegativa: r.distancia_negativa,
      nivelVulnerabilidade: faixa.nivel,
      corVulnerabilidade: faixa.cor,
      valoresOriginais: snapshotValores[r.municipio_id] || null,
      posicao: r.posicao
    };
  });

  const criteriosInfo = Array.isArray(parametros.criterios) ? parametros.criterios : [];

  return {
    simulacaoId: simulacao.id,
    titulo: simulacao.titulo,
    dataExecucao: simulacao.data_execucao,
    status: simulacao.status,
    usuarioNome: simulacao.usuario_nome || null,
    totalAlternativas: ranking.length,
    totalCriterios: criteriosInfo.length,
    pesosUtilizados: parametros.pesosUtilizados || criteriosInfo.map(c => c.peso),
    criteriosInfo,
    ranking,
    resumoEstatistico: resumir(ranking),
    alternativasExcluidas: parametros.alternativasExcluidas || [],
    tempoCalculoMs: parametros.tempoCalculoMs ?? null,
    tempoExecucaoMs: null
  };
}

module.exports = { executar, listar, obter, TITULO_PADRAO };
