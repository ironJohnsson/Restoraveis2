const { Pool, types } = require('pg');

// NUMERIC/DECIMAL e BIGINT chegam como texto por padrão; a aplicação trabalha com números
types.setTypeParser(1700, valor => parseFloat(valor));
types.setTypeParser(20, valor => parseInt(valor, 10));

/** Converte os marcadores `?` (usados em todo o projeto) para `$1, $2...` do PostgreSQL. */
function converterMarcadores(sql) {
  let indice = 0;
  return sql.replace(/\?/g, () => `$${++indice}`);
}

function esperar(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Adaptador PostgreSQL (+ PostGIS). Usado na implantação via Docker Compose,
 * quando a variável DATABASE_URL está definida.
 */
class PostgresAdapter {
  constructor(connectionString, { criarPool } = {}) {
    this.dialect = 'postgres';
    this.pool = criarPool ? criarPool() : new Pool({ connectionString, max: 10 });

    // Sem este tratamento, a queda de uma conexão ociosa (ex.: reinício do banco) derrubaria a API
    if (typeof this.pool.on === 'function') {
      this.pool.on('error', (err) => {
        console.error(`[BANCO] Conexão ociosa com o PostgreSQL encerrada: ${err.message}`);
      });
    }
  }

  /** Aguarda o banco aceitar conexões (o contêiner pode ainda estar inicializando). */
  async conectar({ tentativas = 15, intervaloMs = 2000 } = {}) {
    let ultimoErro;
    for (let i = 1; i <= tentativas; i++) {
      try {
        await this.pool.query('SELECT 1');
        return;
      } catch (err) {
        ultimoErro = err;
        if (i < tentativas) await esperar(intervaloMs);
      }
    }
    throw new Error(`Não foi possível conectar ao PostgreSQL: ${ultimoErro.message}`);
  }

  _executor(cliente) {
    return {
      all: async (sql, params = []) => (await cliente.query(converterMarcadores(sql), params)).rows,
      get: async (sql, params = []) => (await cliente.query(converterMarcadores(sql), params)).rows[0] || null,
      run: async (sql, params = []) => {
        const resultado = await cliente.query(converterMarcadores(sql), params);
        return { changes: resultado.rowCount };
      },
      exec: async (sql) => {
        await cliente.query(sql);
      }
    };
  }

  all(sql, params) {
    return this._executor(this.pool).all(sql, params);
  }

  get(sql, params) {
    return this._executor(this.pool).get(sql, params);
  }

  run(sql, params) {
    return this._executor(this.pool).run(sql, params);
  }

  exec(sql) {
    return this._executor(this.pool).exec(sql);
  }

  async transaction(fn) {
    const cliente = await this.pool.connect();
    try {
      await cliente.query('BEGIN');
      const resultado = await fn(this._executor(cliente));
      await cliente.query('COMMIT');
      return resultado;
    } catch (err) {
      await cliente.query('ROLLBACK').catch(() => {});
      throw err;
    } finally {
      cliente.release();
    }
  }

  async truncar(tabelas) {
    await this.pool.query(`TRUNCATE ${tabelas.join(', ')} RESTART IDENTITY CASCADE`);
  }

  async fechar() {
    await this.pool.end();
  }
}

module.exports = PostgresAdapter;
module.exports.converterMarcadores = converterMarcadores;
