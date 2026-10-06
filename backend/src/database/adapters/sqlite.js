const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const COMANDO_DE_ESCRITA = /^\s*(insert|update|delete|replace|create|alter|drop)\b/i;

function normalizarParametro(valor) {
  if (valor === undefined) return null;
  if (typeof valor === 'boolean') return valor ? 1 : 0;
  if (valor instanceof Date) return valor.toISOString();
  return valor;
}

/**
 * Adaptador SQLite (sql.js / WebAssembly). Usado em desenvolvimento e nos testes:
 * não exige nenhum serviço externo. Com caminho ':memory:' nada é gravado em disco.
 *
 * O sql.js mantém o banco em memória; `_persistir()` grava o arquivo após cada
 * escrita. Atenção: `export()` fecha e reabre o banco, zerando `last_insert_rowid()`
 * e os PRAGMAs — por isso os INSERTs usam `RETURNING id` e os PRAGMAs são reaplicados.
 */
class SqliteAdapter {
  constructor(dbPath) {
    this.dialect = 'sqlite';
    this.dbPath = dbPath;
    this.emMemoria = dbPath === ':memory:';
    this.db = null;
    this.fila = Promise.resolve();
  }

  async conectar() {
    const SQL = await initSqlJs();
    if (!this.emMemoria && fs.existsSync(this.dbPath)) {
      this.db = new SQL.Database(fs.readFileSync(this.dbPath));
    } else {
      this.db = new SQL.Database();
    }
    this._aplicarPragmas();
  }

  _aplicarPragmas() {
    this.db.run('PRAGMA foreign_keys = ON;');
  }

  _persistir() {
    if (this.emMemoria) return;
    const conteudo = Buffer.from(this.db.export());
    this._aplicarPragmas();

    fs.mkdirSync(path.dirname(this.dbPath), { recursive: true });
    const temporario = `${this.dbPath}.tmp`;
    fs.writeFileSync(temporario, conteudo);
    fs.renameSync(temporario, this.dbPath);
  }

  _consultar(sql, params = []) {
    const stmt = this.db.prepare(sql);
    try {
      stmt.bind(params.map(normalizarParametro));
      const linhas = [];
      while (stmt.step()) {
        linhas.push(stmt.getAsObject());
      }
      return linhas;
    } finally {
      stmt.free();
    }
  }

  /** Serializa as operações para que nada se intercale com uma transação aberta. */
  _enfileirar(operacao) {
    const resultado = this.fila.then(operacao);
    this.fila = resultado.catch(() => {});
    return resultado;
  }

  _executor() {
    return {
      all: async (sql, params) => this._consultar(sql, params),
      get: async (sql, params) => this._consultar(sql, params)[0] || null,
      run: async (sql, params) => {
        this._consultar(sql, params);
        return { changes: this.db.getRowsModified() };
      },
      exec: async (sql) => {
        this.db.exec(sql);
      }
    };
  }

  all(sql, params = []) {
    return this._enfileirar(() => {
      const linhas = this._consultar(sql, params);
      if (COMANDO_DE_ESCRITA.test(sql)) this._persistir();
      return linhas;
    });
  }

  async get(sql, params = []) {
    const linhas = await this.all(sql, params);
    return linhas[0] || null;
  }

  run(sql, params = []) {
    return this._enfileirar(() => {
      this._consultar(sql, params);
      const changes = this.db.getRowsModified();
      this._persistir();
      return { changes };
    });
  }

  exec(sql) {
    return this._enfileirar(() => {
      this.db.exec(sql);
      this._persistir();
    });
  }

  /**
   * Executa `fn(tx)` dentro de BEGIN/COMMIT. Dentro da função use sempre o
   * executor `tx` recebido (as operações do adaptador ficam em fila até o fim).
   */
  transaction(fn) {
    return this._enfileirar(async () => {
      this.db.run('BEGIN');
      try {
        const resultado = await fn(this._executor());
        this.db.run('COMMIT');
        this._persistir();
        return resultado;
      } catch (err) {
        this.db.run('ROLLBACK');
        throw err;
      }
    });
  }

  /** Apaga todos os registros das tabelas informadas e reinicia os contadores de id. */
  truncar(tabelas) {
    return this.transaction(async (tx) => {
      for (const tabela of tabelas) {
        await tx.run(`DELETE FROM ${tabela}`);
      }
      await tx.run('DELETE FROM sqlite_sequence');
    });
  }

  async fechar() {
    await this.fila;
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

module.exports = SqliteAdapter;
