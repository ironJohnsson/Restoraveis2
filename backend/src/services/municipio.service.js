const db = require('../database/db');
const Municipio = require('../models/municipio.model');
const Criterio = require('../models/criterio.model');
const HttpError = require('../utils/HttpError');
const v = require('../utils/validacao');

/**
 * Valida os dados cadastrais de um município.
 * Com `parcial`, campos não enviados ficam undefined (não serão alterados).
 */
function validarCadastro(corpo, { parcial = false } = {}) {
  const obrigatorio = !parcial;
  const dados = {
    nome: v.texto(corpo.nome, 'nome', { max: 200, obrigatorio }),
    uf: v.uf(corpo.uf, { obrigatorio }),
    populacao: v.numero(corpo.populacao, 'populacao', { min: 0, inteiro: true }),
    idh: v.numero(corpo.idh, 'idh', { min: 0, max: 1 }),
    latitude: v.numero(corpo.latitude, 'latitude', { min: -90, max: 90, obrigatorio }),
    longitude: v.numero(corpo.longitude, 'longitude', { min: -180, max: 180, obrigatorio }),
    codigoIbge: v.codigoIbge(corpo.codigoIbge ?? corpo.codigo_ibge)
  };

  // Campos obrigatórios do cadastro não podem ser apagados em uma atualização
  for (const campo of ['nome', 'uf', 'latitude', 'longitude']) {
    if (dados[campo] === null) {
      throw new HttpError(400, `O campo '${campo}' não pode ficar vazio`);
    }
  }
  return dados;
}

/**
 * Converte { C1: 5.2, C2: null } em [{ criterioId, valor }], validando os códigos
 * dos critérios e os valores (números >= 0; null remove o dado).
 */
function validarIndicadores(indicadores, criterios) {
  if (indicadores === undefined || indicadores === null) return [];
  if (typeof indicadores !== 'object' || Array.isArray(indicadores)) {
    throw new HttpError(400, "O campo 'indicadores' deve ser um objeto no formato { C1: 5.2, C2: 1.8 }");
  }

  const porCodigo = new Map(criterios.map(c => [c.codigo.toUpperCase(), c]));
  const valores = [];
  for (const [codigo, bruto] of Object.entries(indicadores)) {
    const criterio = porCodigo.get(codigo.toUpperCase());
    if (!criterio) {
      throw new HttpError(400, `Critério inexistente em 'indicadores': ${codigo}`);
    }
    const valor = v.numero(bruto, `indicadores.${criterio.codigo}`, { min: 0 });
    if (valor !== undefined) {
      valores.push({ criterioId: criterio.id, valor });
    }
  }
  return valores;
}

function validarAnoReferencia(ano) {
  const valor = v.numero(ano, 'anoReferencia', { min: 1900, max: 2100, inteiro: true });
  return valor === null ? undefined : valor;
}

async function garantirUnicidade({ nome, uf, codigoIbge }, idAtual, q) {
  if (nome && uf) {
    const mesmoNome = await Municipio.buscarPorNomeUf(nome, uf, q);
    if (mesmoNome && mesmoNome.id !== idAtual) {
      throw new HttpError(409, `Município '${nome} - ${uf}' já está cadastrado`);
    }
  }
  if (codigoIbge) {
    const mesmoCodigo = await Municipio.buscarPorCodigoIbge(codigoIbge, q);
    if (mesmoCodigo && mesmoCodigo.id !== idAtual) {
      throw new HttpError(409, `Já existe um município com o código IBGE ${codigoIbge}`);
    }
  }
}

/** UC01 — Cadastrar Município: dados cadastrais + indicadores em uma única transação. */
async function criar(corpo) {
  const dados = validarCadastro(corpo);
  const indicadores = validarIndicadores(corpo.indicadores, await Criterio.listar())
    .filter(item => item.valor !== null);
  const ano = validarAnoReferencia(corpo.anoReferencia);

  return db.transaction(async (tx) => {
    await garantirUnicidade(dados, null, tx);
    const id = await Municipio.criar(dados, tx);
    await Municipio.salvarIndicadores(id, indicadores, ano, tx);
    return id;
  });
}

async function atualizar(id, corpo) {
  const dados = validarCadastro(corpo, { parcial: true });
  const indicadores = validarIndicadores(corpo.indicadores, await Criterio.listar());
  const ano = validarAnoReferencia(corpo.anoReferencia);

  return db.transaction(async (tx) => {
    const atual = await Municipio.buscarPorId(id, tx);
    if (!atual) {
      throw new HttpError(404, 'Município não encontrado');
    }
    await garantirUnicidade(
      { nome: dados.nome ?? atual.nome, uf: dados.uf ?? atual.uf, codigoIbge: dados.codigoIbge },
      id,
      tx
    );
    await Municipio.atualizar(id, dados, tx);
    await Municipio.salvarIndicadores(id, indicadores, ano, tx);
  });
}

async function remover(id) {
  const removido = await db.transaction(tx => Municipio.remover(id, tx));
  if (!removido) {
    throw new HttpError(404, 'Município não encontrado');
  }
}

module.exports = { criar, atualizar, remover, validarCadastro, validarIndicadores, garantirUnicidade };
