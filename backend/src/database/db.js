const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
const config = require('../config/config');

let dbInstance = null;
let SQL = null;

const dataDir = path.dirname(config.dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

/**
 * Inicializa a conexão com o banco SQLite (via WebAssembly sql.js)
 * Executa as migrações e seeds caso o arquivo de banco ainda não exista.
 */
async function getDb() {
  if (dbInstance) {
    return dbInstance;
  }

  if (!SQL) {
    SQL = await initSqlJs();
  }

  const dbFileExists = fs.existsSync(config.dbPath);

  if (dbFileExists) {
    const fileBuffer = fs.readFileSync(config.dbPath);
    dbInstance = new SQL.Database(fileBuffer);
  } else {
    dbInstance = new SQL.Database();
    // Executa schema e seeds
    const schemaPath = path.join(__dirname, '../../migrations/001_schema_sqlite.sql');
    const seedsPath = path.join(__dirname, '../../migrations/002_seeds.sql');

    if (fs.existsSync(schemaPath)) {
      const schemaSql = fs.readFileSync(schemaPath, 'utf8');
      dbInstance.run(schemaSql);
    }

    if (fs.existsSync(seedsPath)) {
      const seedsSql = fs.readFileSync(seedsPath, 'utf8');
      dbInstance.run(seedsSql);
    }

    save();
  }

  return dbInstance;
}

/**
 * Salva o estado atual do banco no arquivo SQLite em disco
 */
function save() {
  if (!dbInstance) return;
  try {
    const data = dbInstance.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(config.dbPath, buffer);
  } catch (err) {
    console.error('Erro ao persistir banco SQLite em disco:', err);
  }
}

/**
 * Executa uma consulta e retorna todas as linhas como array de objetos
 */
async function all(sql, params = []) {
  const db = await getDb();
  const stmt = db.prepare(sql);
  stmt.bind(params);

  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

/**
 * Executa uma consulta e retorna a primeira linha ou null
 */
async function get(sql, params = []) {
  const rows = await all(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

/**
 * Executa comando DML (INSERT, UPDATE, DELETE) e persiste em disco
 */
async function run(sql, params = []) {
  const db = await getDb();
  db.run(sql, params);
  save();

  const lastIdRes = db.exec("SELECT last_insert_rowid() AS id;");
  const lastInsertRowid = lastIdRes.length > 0 && lastIdRes[0].values.length > 0 ? lastIdRes[0].values[0][0] : null;

  const changesRes = db.exec("SELECT changes() AS ch;");
  const changes = changesRes.length > 0 && changesRes[0].values.length > 0 ? changesRes[0].values[0][0] : 0;

  return { lastInsertRowid, changes };
}

/**
 * Executa múltiplos comandos SQL em lote
 */
async function exec(sql) {
  const db = await getDb();
  db.run(sql);
  save();
}

module.exports = {
  getDb,
  all,
  get,
  run,
  exec,
  save
};
