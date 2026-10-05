const db = require('../database/db');
const Municipio = require('../models/municipio.model');
const Criterio = require('../models/criterio.model');
const HttpError = require('../utils/HttpError');
const { validarCadastro, validarIndicadores } = require('./municipio.service');

/**
 * Importação de dados de fontes externas por arquivo (RF09).
 *
 * As bases oficiais (IBGE/SIDRA, Dados Abertos da ANEEL, Atlas Solarimétrico do INPE)
 * são distribuídas em planilhas; o gestor consolida os indicadores em um CSV no
 * formato do modelo (`modeloCsv`) e a plataforma cria ou atualiza os municípios.
 */
const MAXIMO_DE_LINHAS = 5000;

const APELIDOS = {
  nome: 'nome', municipio: 'nome',
  uf: 'uf', estado: 'uf',
  codigo_ibge: 'codigoIbge', codigoibge: 'codigoIbge', ibge: 'codigoIbge',
  populacao: 'populacao',
  idh: 'idh',
  latitude: 'latitude', lat: 'latitude',
  longitude: 'longitude', lon: 'longitude', lng: 'longitude', long: 'longitude'
};

function normalizarCabecalho(texto) {
  return String(texto)
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .trim().toLowerCase().replace(/[\s-]+/g, '_');
}

function detectarSeparador(primeiraLinha) {
  const candidatos = [';', ',', '\t'];
  return candidatos
    .map(sep => ({ sep, total: primeiraLinha.split(sep).length }))
    .sort((a, b) => b.total - a.total)[0].sep;
}

/**
 * Parser de CSV (RFC 4180): campos entre aspas, aspas escapadas ("") e quebras de
 * linha dentro de campos. Detecta o separador (; , ou tab) pela primeira linha.
 * Devolve uma lista de linhas, cada uma como lista de textos.
 */
function parseCsv(textoCsv) {
  const texto = String(textoCsv || '').replace(/^﻿/, '');
  const fimPrimeiraLinha = texto.search(/\r?\n/);
  const separador = detectarSeparador(fimPrimeiraLinha === -1 ? texto : texto.slice(0, fimPrimeiraLinha));

  const linhas = [];
  let linha = [];
  let campo = '';
  let entreAspas = false;

  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];

    if (entreAspas) {
      if (c === '"' && texto[i + 1] === '"') {
        campo += '"';
        i++;
      } else if (c === '"') {
        entreAspas = false;
      } else {
        campo += c;
      }
    } else if (c === '"' && campo === '') {
      entreAspas = true;
    } else if (c === separador) {
      linha.push(campo);
      campo = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && texto[i + 1] === '\n') i++;
      linha.push(campo);
      linhas.push(linha);
      linha = [];
      campo = '';
    } else {
      campo += c;
    }
  }
  if (campo !== '' || linha.length > 0) {
    linha.push(campo);
    linhas.push(linha);
  }

  return linhas.filter(l => l.some(celula => celula.trim() !== ''));
}

/** Modelo de planilha com o cabeçalho esperado e uma linha de exemplo. */
async function modeloCsv() {
  const criterios = await Criterio.listar();
  const cabecalho = ['nome', 'uf', 'codigo_ibge', 'populacao', 'idh', 'latitude', 'longitude', ...criterios.map(c => c.codigo)];
  // Linha de exemplo com dados do IBGE (Censo 2022 e centroide da malha municipal)
  const exemplo = ['Irecê', 'BA', '2914604', '74507', '', '-11,3094', '-41,839', ...criterios.map(() => '')];
  return `﻿${cabecalho.join(';')}\n${exemplo.join(';')}\n`;
}

/**
 * Cria ou atualiza municípios e seus indicadores a partir de um CSV.
 * Um município existente é localizado pelo código IBGE ou por nome + UF; células
 * vazias não alteram o valor já cadastrado. Linhas inválidas são ignoradas e
 * relatadas em `erros`, sem impedir a importação das demais.
 */
async function importarMunicipios(textoCsv, { anoReferencia } = {}) {
  const linhas = parseCsv(textoCsv);
  if (linhas.length < 2) {
    throw new HttpError(400, 'O arquivo deve conter o cabeçalho e ao menos uma linha de dados');
  }
  if (linhas.length - 1 > MAXIMO_DE_LINHAS) {
    throw new HttpError(400, `O arquivo excede o limite de ${MAXIMO_DE_LINHAS} linhas por importação`);
  }

  const criterios = await Criterio.listar();
  const codigosCriterios = new Map(criterios.map(c => [c.codigo.toLowerCase(), c.codigo]));

  const colunasIgnoradas = [];
  const colunas = linhas[0].map((titulo) => {
    const chave = normalizarCabecalho(titulo);
    if (APELIDOS[chave]) return { campo: APELIDOS[chave] };
    if (codigosCriterios.has(chave)) return { indicador: codigosCriterios.get(chave) };
    if (titulo.trim() !== '') colunasIgnoradas.push(titulo.trim());
    return null;
  });

  const campos = colunas.filter(Boolean).map(c => c.campo);
  for (const obrigatorio of ['nome', 'uf']) {
    if (!campos.includes(obrigatorio)) {
      throw new HttpError(400, `Coluna obrigatória ausente no cabeçalho: ${obrigatorio}`);
    }
  }

  const resultado = { total: linhas.length - 1, criados: 0, atualizados: 0, erros: [], colunasIgnoradas };

  await db.transaction(async (tx) => {
    for (let i = 1; i < linhas.length; i++) {
      const numeroLinha = i + 1;
      try {
        const corpo = {};
        const indicadoresBrutos = {};
        colunas.forEach((coluna, j) => {
          const celula = (linhas[i][j] ?? '').trim();
          if (!coluna || celula === '') return;
          if (coluna.campo) corpo[coluna.campo] = celula;
          else indicadoresBrutos[coluna.indicador] = celula;
        });

        const indicadores = validarIndicadores(indicadoresBrutos, criterios);
        const chave = validarCadastro({ nome: corpo.nome, uf: corpo.uf, codigoIbge: corpo.codigoIbge }, { parcial: true });
        if (!chave.nome || !chave.uf) {
          throw new HttpError(400, "Os campos 'nome' e 'uf' são obrigatórios");
        }

        const porCodigo = chave.codigoIbge ? await Municipio.buscarPorCodigoIbge(chave.codigoIbge, tx) : null;
        const porNome = await Municipio.buscarPorNomeUf(chave.nome, chave.uf, tx);
        if (porCodigo && porNome && porCodigo.id !== porNome.id) {
          throw new HttpError(409, `O código IBGE ${chave.codigoIbge} pertence a outro município já cadastrado`);
        }
        const existente = porCodigo || porNome;

        if (existente) {
          await Municipio.atualizar(existente.id, validarCadastro(corpo, { parcial: true }), tx);
          await Municipio.salvarIndicadores(existente.id, indicadores, anoReferencia, tx);
          resultado.atualizados++;
        } else {
          const id = await Municipio.criar(validarCadastro(corpo), tx);
          await Municipio.salvarIndicadores(id, indicadores, anoReferencia, tx);
          resultado.criados++;
        }
      } catch (err) {
        if (!(err instanceof HttpError)) throw err;
        resultado.erros.push({ linha: numeroLinha, mensagem: err.message });
      }
    }
  });

  return resultado;
}

module.exports = { parseCsv, modeloCsv, importarMunicipios, MAXIMO_DE_LINHAS };
