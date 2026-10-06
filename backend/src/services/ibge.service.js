const config = require('../config/config');
const HttpError = require('../utils/HttpError');

/**
 * Integração com fontes externas abertas (RF09):
 * - API de Localidades, Malhas e Agregados (SIDRA) do IBGE;
 * - ViaCEP, para localizar o município a partir de um CEP.
 */
const IBGE = 'https://servicodados.ibge.gov.br/api';
const VIACEP = 'https://viacep.com.br/ws';

async function buscarJson(url, { opcional = false } = {}) {
  let resposta;
  try {
    resposta = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(config.ibgeTimeoutMs)
    });
  } catch (err) {
    if (opcional) return null;
    throw new HttpError(502, 'Não foi possível consultar o serviço externo (IBGE/ViaCEP). Tente novamente em instantes.');
  }

  if (!resposta.ok) {
    if (opcional) return null;
    throw new HttpError(502, `O serviço externo respondeu com erro (HTTP ${resposta.status})`);
  }

  try {
    return await resposta.json();
  } catch (err) {
    if (opcional) return null;
    throw new HttpError(502, 'Resposta inválida do serviço externo');
  }
}

function siglaUf(localidade) {
  return localidade?.microrregiao?.mesorregiao?.UF?.sigla
    || localidade?.['regiao-imediata']?.['regiao-intermediaria']?.UF?.sigla
    || null;
}

/**
 * Dados cadastrais de um município pelo código IBGE de 7 dígitos:
 * nome e UF (Localidades), centroide (Malhas) e população do Censo 2022 (Agregado 4714).
 * População e coordenadas são opcionais: se a consulta falhar, voltam como null.
 */
async function buscarMunicipioPorCodigo(codigo) {
  if (!/^\d{7}$/.test(String(codigo))) {
    throw new HttpError(400, 'O código IBGE do município deve ter 7 dígitos');
  }

  const localidade = await buscarJson(`${IBGE}/v1/localidades/municipios/${codigo}`);
  if (!localidade || Array.isArray(localidade) || !localidade.id) {
    throw new HttpError(404, `Município com código IBGE ${codigo} não encontrado`);
  }

  const [malha, censo] = await Promise.all([
    buscarJson(`${IBGE}/v3/malhas/municipios/${codigo}/metadados`, { opcional: true }),
    buscarJson(`${IBGE}/v3/agregados/4714/periodos/2022/variaveis/93?localidades=N6[${codigo}]`, { opcional: true })
  ]);

  const centroide = Array.isArray(malha) ? malha[0]?.centroide : null;
  const serie = Array.isArray(censo) ? censo[0]?.resultados?.[0]?.series?.[0]?.serie : null;
  const populacao = serie ? Number(serie['2022']) : NaN;

  return {
    codigoIbge: String(localidade.id),
    nome: localidade.nome,
    uf: siglaUf(localidade),
    populacao: Number.isFinite(populacao) ? populacao : null,
    latitude: centroide ? Number(centroide.latitude) : null,
    longitude: centroide ? Number(centroide.longitude) : null,
    fonte: 'IBGE (Localidades, Malhas e Censo 2022)'
  };
}

function semAcento(texto) {
  return String(texto).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

/** Lista municípios de uma UF cujo nome contém o termo informado (sem diferenciar acentos). */
async function pesquisarMunicipios(uf, termo = '') {
  const lista = await buscarJson(`${IBGE}/v1/localidades/estados/${uf}/municipios`);
  if (!Array.isArray(lista)) {
    throw new HttpError(502, 'Resposta inválida do serviço de localidades do IBGE');
  }

  const alvo = semAcento(termo.trim());
  return lista
    .filter(m => semAcento(m.nome).includes(alvo))
    .slice(0, 20)
    .map(m => ({ codigoIbge: String(m.id), nome: m.nome, uf }));
}

/** Localiza o município de um CEP (ViaCEP) e devolve seus dados do IBGE. */
async function buscarMunicipioPorCep(cep) {
  const digitos = String(cep).replace(/\D/g, '');
  if (digitos.length !== 8) {
    throw new HttpError(400, 'O CEP deve ter 8 dígitos');
  }

  const endereco = await buscarJson(`${VIACEP}/${digitos}/json/`);
  if (!endereco || endereco.erro || !endereco.ibge) {
    throw new HttpError(404, `CEP ${digitos} não encontrado`);
  }
  return buscarMunicipioPorCodigo(endereco.ibge);
}

module.exports = { buscarMunicipioPorCodigo, buscarMunicipioPorCep, pesquisarMunicipios };
