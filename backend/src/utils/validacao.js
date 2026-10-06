const HttpError = require('./HttpError');

const UFS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA',
  'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

const PERFIS = ['admin', 'pesquisador', 'gestor'];
const TIPOS_CRITERIO = ['beneficio', 'custo'];

function ausente(valor) {
  return valor === undefined || valor === null || (typeof valor === 'string' && valor.trim() === '');
}

/**
 * Converte e valida um número. Aceita vírgula decimal ("0,75").
 * Retorna undefined quando o campo não foi enviado e null quando veio vazio.
 */
function numero(valor, campo, { min, max, inteiro = false, obrigatorio = false } = {}) {
  if (valor === undefined) {
    if (obrigatorio) throw new HttpError(400, `O campo '${campo}' é obrigatório`);
    return undefined;
  }
  if (ausente(valor)) {
    if (obrigatorio) throw new HttpError(400, `O campo '${campo}' é obrigatório`);
    return null;
  }

  const convertido = typeof valor === 'string' ? Number(valor.trim().replace(',', '.')) : Number(valor);
  if (typeof valor === 'boolean' || !Number.isFinite(convertido)) {
    throw new HttpError(400, `O campo '${campo}' deve ser numérico`);
  }
  if (inteiro && !Number.isInteger(convertido)) {
    throw new HttpError(400, `O campo '${campo}' deve ser um número inteiro`);
  }
  if (min !== undefined && convertido < min) {
    throw new HttpError(400, `O campo '${campo}' deve ser maior ou igual a ${min}`);
  }
  if (max !== undefined && convertido > max) {
    throw new HttpError(400, `O campo '${campo}' deve ser menor ou igual a ${max}`);
  }
  return convertido;
}

function texto(valor, campo, { max = 255, obrigatorio = false } = {}) {
  if (valor === undefined) {
    if (obrigatorio) throw new HttpError(400, `O campo '${campo}' é obrigatório`);
    return undefined;
  }
  if (ausente(valor)) {
    if (obrigatorio) throw new HttpError(400, `O campo '${campo}' é obrigatório`);
    return null;
  }
  if (typeof valor !== 'string' && typeof valor !== 'number') {
    throw new HttpError(400, `O campo '${campo}' deve ser um texto`);
  }
  const limpo = String(valor).trim();
  if (limpo.length > max) {
    throw new HttpError(400, `O campo '${campo}' deve ter no máximo ${max} caracteres`);
  }
  return limpo;
}

function uf(valor, { obrigatorio = false } = {}) {
  const sigla = texto(valor, 'uf', { max: 2, obrigatorio });
  if (sigla === undefined || sigla === null) return sigla;
  const maiuscula = sigla.toUpperCase();
  if (!UFS.includes(maiuscula)) {
    throw new HttpError(400, `UF inválida: '${sigla}'`);
  }
  return maiuscula;
}

function email(valor, { obrigatorio = false } = {}) {
  const endereco = texto(valor, 'email', { max: 150, obrigatorio });
  if (endereco === undefined || endereco === null) return endereco;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(endereco)) {
    throw new HttpError(400, 'E-mail inválido');
  }
  return endereco.toLowerCase();
}

function senha(valor, campo = 'senha') {
  if (typeof valor !== 'string' || valor.length < 8) {
    throw new HttpError(400, `O campo '${campo}' deve ter no mínimo 8 caracteres`);
  }
  if (valor.length > 72) {
    throw new HttpError(400, `O campo '${campo}' deve ter no máximo 72 caracteres`);
  }
  return valor;
}

function perfil(valor, { obrigatorio = false } = {}) {
  const nome = texto(valor, 'perfil', { max: 50, obrigatorio });
  if (nome === undefined || nome === null) return nome;
  if (!PERFIS.includes(nome)) {
    throw new HttpError(400, `Perfil inválido. Utilize: ${PERFIS.join(', ')}`);
  }
  return nome;
}

function tipoCriterio(valor, { obrigatorio = false } = {}) {
  const tipo = texto(valor, 'tipo', { max: 10, obrigatorio });
  if (tipo === undefined || tipo === null) return tipo;
  const minusculo = tipo.toLowerCase();
  if (!TIPOS_CRITERIO.includes(minusculo)) {
    throw new HttpError(400, "O campo 'tipo' deve ser 'beneficio' ou 'custo'");
  }
  return minusculo;
}

function codigoIbge(valor) {
  const codigo = texto(valor, 'codigoIbge', { max: 7 });
  if (codigo === undefined || codigo === null) return codigo;
  if (!/^\d{7}$/.test(codigo)) {
    throw new HttpError(400, 'O código IBGE do município deve ter 7 dígitos');
  }
  return codigo;
}

function idParam(valor, campo = 'id') {
  const id = Number(valor);
  if (!Number.isInteger(id) || id <= 0) {
    throw new HttpError(400, `Parâmetro '${campo}' inválido`);
  }
  return id;
}

module.exports = {
  UFS,
  PERFIS,
  TIPOS_CRITERIO,
  ausente,
  numero,
  texto,
  uf,
  email,
  senha,
  perfil,
  tipoCriterio,
  codigoIbge,
  idParam
};
