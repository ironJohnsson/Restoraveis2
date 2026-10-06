const db = require('../database/db');
const config = require('../config/config');
const { paraIso } = require('../utils/datas');

const COLUNAS = 'id, nome, uf, populacao, idh, latitude, longitude, codigo_ibge, created_at';

/**
 * Chave de comparação de nomes: sem acentos e sem diferenciar maiúsculas.
 * Feita em JavaScript porque o LOWER() do SQLite só trata caracteres ASCII
 * ("IRECÊ" e "Irecê" não seriam reconhecidos como o mesmo município).
 */
function chaveDeNome(texto) {
  return String(texto ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
}

function formatar(municipio) {
  if (!municipio) return null;
  return { ...municipio, created_at: paraIso(municipio.created_at) };
}

/**
 * Valores vigentes da matriz de decisão: para cada par (município, critério),
 * o registro do ano de referência mais recente. Uma única consulta, sem N+1.
 */
async function valoresVigentes({ municipioId } = {}, q = db) {
  const filtro = municipioId ? 'AND md.municipio_id = ?' : '';
  return q.all(
    `SELECT md.municipio_id, md.criterio_id, md.valor, md.ano_referencia,
            c.codigo, c.nome AS criterio_nome, c.tipo, c.unidade, c.peso
     FROM matriz_decisao md
     JOIN criterios c ON c.id = md.criterio_id
     WHERE md.ano_referencia = (
       SELECT MAX(m2.ano_referencia) FROM matriz_decisao m2
       WHERE m2.municipio_id = md.municipio_id AND m2.criterio_id = md.criterio_id
     ) ${filtro}
     ORDER BY md.municipio_id ASC, c.id ASC`,
    municipioId ? [municipioId] : []
  );
}

function anexarIndicadores(municipios, valores) {
  const porMunicipio = new Map();
  for (const v of valores) {
    if (!porMunicipio.has(v.municipio_id)) porMunicipio.set(v.municipio_id, []);
    porMunicipio.get(v.municipio_id).push(v);
  }

  return municipios.map((municipio) => {
    const detalhe = (porMunicipio.get(municipio.id) || []).map(v => ({
      criterio_id: v.criterio_id,
      codigo: v.codigo,
      criterio_nome: v.criterio_nome,
      tipo: v.tipo,
      unidade: v.unidade,
      peso: v.peso,
      valor: v.valor,
      ano_referencia: v.ano_referencia
    }));
    const indicadores = {};
    detalhe.forEach((v) => { indicadores[v.codigo] = v.valor; });
    return { ...formatar(municipio), indicadores, indicadoresDetalhe: detalhe };
  });
}

/** Lista municípios com seus indicadores. Filtros opcionais: uf e busca (nome/UF). */
async function listar({ uf, busca } = {}, q = db) {
  let sql = `SELECT ${COLUNAS} FROM municipios WHERE 1=1`;
  const params = [];

  if (uf) {
    sql += ' AND uf = ?';
    params.push(uf);
  }
  sql += ' ORDER BY nome ASC';

  let municipios = await q.all(sql, params);
  if (busca) {
    const alvo = chaveDeNome(busca);
    municipios = municipios.filter(m => chaveDeNome(m.nome).includes(alvo) || chaveDeNome(m.uf).includes(alvo));
  }
  return anexarIndicadores(municipios, await valoresVigentes({}, q));
}

/** Somente os dados cadastrais (sem indicadores), em ordem de id. */
async function listarCadastro(q = db) {
  return (await q.all(`SELECT ${COLUNAS} FROM municipios ORDER BY id ASC`)).map(formatar);
}

async function buscarPorId(id, q = db) {
  const municipio = await q.get(`SELECT ${COLUNAS} FROM municipios WHERE id = ?`, [id]);
  if (!municipio) return null;
  return anexarIndicadores([municipio], await valoresVigentes({ municipioId: id }, q))[0];
}

/** Município de mesmo nome na UF, ignorando acentos e maiúsculas. Devolve { id } ou null. */
async function buscarPorNomeUf(nome, uf, q = db) {
  const alvo = chaveDeNome(nome);
  const candidatos = await q.all('SELECT id, nome FROM municipios WHERE uf = ?', [uf]);
  const encontrado = candidatos.find(m => chaveDeNome(m.nome) === alvo);
  return encontrado ? { id: encontrado.id } : null;
}

async function buscarPorCodigoIbge(codigoIbge, q = db) {
  return q.get('SELECT id FROM municipios WHERE codigo_ibge = ?', [codigoIbge]);
}

async function criar({ nome, uf, populacao, idh, latitude, longitude, codigoIbge }, q = db) {
  const criado = await q.get(
    `INSERT INTO municipios (nome, uf, populacao, idh, latitude, longitude, codigo_ibge, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`,
    [nome, uf, populacao ?? null, idh ?? null, latitude, longitude, codigoIbge ?? null, new Date().toISOString()]
  );
  return criado.id;
}

/**
 * Atualização parcial: `campos` contém apenas as colunas a alterar
 * (um valor null limpa o campo; chaves ausentes permanecem como estão).
 */
async function atualizar(id, campos, q = db) {
  const mapa = {
    nome: 'nome',
    uf: 'uf',
    populacao: 'populacao',
    idh: 'idh',
    latitude: 'latitude',
    longitude: 'longitude',
    codigoIbge: 'codigo_ibge'
  };
  const atribuicoes = [];
  const params = [];
  for (const [chave, coluna] of Object.entries(mapa)) {
    if (campos[chave] !== undefined) {
      atribuicoes.push(`${coluna} = ?`);
      params.push(campos[chave]);
    }
  }
  if (atribuicoes.length === 0) return;
  await q.run(`UPDATE municipios SET ${atribuicoes.join(', ')} WHERE id = ?`, [...params, id]);
}

/**
 * Grava indicadores na matriz de decisão.
 * `valores` é uma lista de { criterioId, valor }: valor numérico insere/atualiza o
 * registro do ano de referência; valor null remove o dado daquele critério.
 */
async function salvarIndicadores(municipioId, valores, anoReferencia = config.anoReferenciaPadrao, q = db) {
  for (const { criterioId, valor } of valores) {
    if (valor === null) {
      await q.run('DELETE FROM matriz_decisao WHERE municipio_id = ? AND criterio_id = ?', [municipioId, criterioId]);
    } else {
      await q.run(
        `INSERT INTO matriz_decisao (municipio_id, criterio_id, valor, ano_referencia)
         VALUES (?, ?, ?, ?)
         ON CONFLICT (municipio_id, criterio_id, ano_referencia) DO UPDATE SET valor = excluded.valor`,
        [municipioId, criterioId, valor, anoReferencia]
      );
    }
  }
}

async function remover(id, q = db) {
  await q.run('DELETE FROM matriz_decisao WHERE municipio_id = ?', [id]);
  await q.run('DELETE FROM resultados_ranking WHERE municipio_id = ?', [id]);
  const { changes } = await q.run('DELETE FROM municipios WHERE id = ?', [id]);
  return changes > 0;
}

module.exports = {
  listar,
  listarCadastro,
  buscarPorId,
  buscarPorNomeUf,
  buscarPorCodigoIbge,
  valoresVigentes,
  criar,
  atualizar,
  salvarIndicadores,
  remover
};
