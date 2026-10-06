const fs = require('fs');
const os = require('os');
const path = require('path');
const initSqlJs = require('sql.js');

const SqliteAdapter = require('../../src/database/adapters/sqlite');
const PostgresAdapter = require('../../src/database/adapters/postgres');
const { migrar } = require('../../src/database/migrate');
const { semear, repararHashLegado, HASH_LEGADO_INVALIDO } = require('../../src/database/seed');

function pastaTemporaria() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'topsis-teste-'));
}

describe('SqliteAdapter', () => {
  let adapter;

  beforeEach(async () => {
    adapter = new SqliteAdapter(':memory:');
    await adapter.conectar();
    await adapter.exec('CREATE TABLE pai (id INTEGER PRIMARY KEY AUTOINCREMENT, nome TEXT NOT NULL UNIQUE);' +
      'CREATE TABLE filho (id INTEGER PRIMARY KEY AUTOINCREMENT, pai_id INTEGER NOT NULL REFERENCES pai(id) ON DELETE CASCADE);');
  });

  afterEach(() => adapter.fechar());

  test('INSERT ... RETURNING devolve o id real do registro', async () => {
    const a = await adapter.get('INSERT INTO pai (nome) VALUES (?) RETURNING id', ['a']);
    const b = await adapter.get('INSERT INTO pai (nome) VALUES (?) RETURNING id', ['b']);
    expect([a.id, b.id]).toEqual([1, 2]);
  });

  test('run informa as linhas afetadas; get devolve null quando não há linha', async () => {
    await adapter.run('INSERT INTO pai (nome) VALUES (?), (?)', ['a', 'b']);
    expect((await adapter.run('UPDATE pai SET nome = nome || ?', ['!'])).changes).toBe(2);
    expect((await adapter.run('DELETE FROM pai WHERE id = ?', [999])).changes).toBe(0);
    expect(await adapter.get('SELECT * FROM pai WHERE id = ?', [999])).toBeNull();
  });

  test('converte parâmetros undefined, boolean e Date', async () => {
    await adapter.exec('CREATE TABLE tipos (a TEXT, b INTEGER, c TEXT)');
    await adapter.run('INSERT INTO tipos (a, b, c) VALUES (?, ?, ?)', [undefined, true, new Date('2026-01-02T03:04:05Z')]);
    expect(await adapter.get('SELECT * FROM tipos')).toEqual({ a: null, b: 1, c: '2026-01-02T03:04:05.000Z' });
  });

  test('chaves estrangeiras são verificadas e ON DELETE CASCADE funciona', async () => {
    const pai = await adapter.get('INSERT INTO pai (nome) VALUES (?) RETURNING id', ['a']);
    await adapter.run('INSERT INTO filho (pai_id) VALUES (?)', [pai.id]);
    await expect(adapter.run('INSERT INTO filho (pai_id) VALUES (?)', [0])).rejects.toThrow(/FOREIGN KEY/);

    await adapter.run('DELETE FROM pai WHERE id = ?', [pai.id]);
    expect((await adapter.get('SELECT COUNT(*) AS total FROM filho')).total).toBe(0);
  });

  test('transação confirma tudo ou desfaz tudo', async () => {
    await adapter.transaction(async (tx) => {
      const pai = await tx.get('INSERT INTO pai (nome) VALUES (?) RETURNING id', ['ok']);
      await tx.run('INSERT INTO filho (pai_id) VALUES (?)', [pai.id]);
      expect((await tx.all('SELECT * FROM filho')).length).toBe(1);
    });
    expect((await adapter.get('SELECT COUNT(*) AS total FROM pai')).total).toBe(1);

    await expect(adapter.transaction(async (tx) => {
      await tx.run('INSERT INTO pai (nome) VALUES (?)', ['desfeito']);
      await tx.run('INSERT INTO pai (nome) VALUES (?)', ['ok']); // viola UNIQUE
    })).rejects.toThrow(/UNIQUE/);
    expect((await adapter.all('SELECT nome FROM pai')).map(p => p.nome)).toEqual(['ok']);
  });

  test('operações concorrentes esperam a transação em andamento terminar', async () => {
    const ordem = [];
    const transacao = adapter.transaction(async (tx) => {
      await tx.run('INSERT INTO pai (nome) VALUES (?)', ['dentro']);
      await new Promise(resolve => setTimeout(resolve, 30));
      ordem.push('fim da transação');
    });
    const leitura = adapter.all('SELECT nome FROM pai').then((linhas) => {
      ordem.push('leitura');
      return linhas;
    });

    await transacao;
    expect(await leitura).toEqual([{ nome: 'dentro' }]);
    expect(ordem).toEqual(['fim da transação', 'leitura']);
  });

  test('truncar apaga os dados e reinicia os contadores de id', async () => {
    await adapter.run('INSERT INTO pai (nome) VALUES (?)', ['a']);
    await adapter.truncar(['filho', 'pai']);
    expect((await adapter.get('INSERT INTO pai (nome) VALUES (?) RETURNING id', ['b'])).id).toBe(1);
  });

  test('em arquivo: persiste após cada escrita, mantém chaves estrangeiras e reabre os dados', async () => {
    const arquivo = path.join(pastaTemporaria(), 'sub', 'banco.sqlite');
    const emDisco = new SqliteAdapter(arquivo);
    await emDisco.conectar();
    await emDisco.exec('CREATE TABLE pai (id INTEGER PRIMARY KEY AUTOINCREMENT, nome TEXT);' +
      'CREATE TABLE filho (id INTEGER PRIMARY KEY, pai_id INTEGER NOT NULL REFERENCES pai(id));');

    // o id continua correto mesmo com o banco sendo regravado em disco a cada INSERT
    expect((await emDisco.get('INSERT INTO pai (nome) VALUES (?) RETURNING id', ['a'])).id).toBe(1);
    expect((await emDisco.get('INSERT INTO pai (nome) VALUES (?) RETURNING id', ['b'])).id).toBe(2);
    await expect(emDisco.run('INSERT INTO filho (pai_id) VALUES (?)', [0])).rejects.toThrow(/FOREIGN KEY/);
    await emDisco.fechar();
    expect(fs.existsSync(`${arquivo}.tmp`)).toBe(false);

    const reaberto = new SqliteAdapter(arquivo);
    await reaberto.conectar();
    expect(await reaberto.all('SELECT nome FROM pai ORDER BY id')).toEqual([{ nome: 'a' }, { nome: 'b' }]);
    await reaberto.fechar();
  });
});

describe('migrations', () => {
  test('aplica cada arquivo uma única vez e registra em schema_migrations', async () => {
    const adapter = new SqliteAdapter(':memory:');
    await adapter.conectar();
    const mensagens = [];

    const primeira = await migrar(adapter, { log: m => mensagens.push(m) });
    expect(primeira).toEqual(['001_schema.sql', '002_codigo_ibge_e_integridade.sql']);
    expect(mensagens).toHaveLength(2);
    expect(await migrar(adapter)).toEqual([]);

    const colunas = (await adapter.all('PRAGMA table_info(municipios)')).map(c => c.name);
    expect(colunas).toContain('codigo_ibge');
    await adapter.fechar();
  });

  test('migration opcional que falha gera apenas aviso; obrigatória interrompe a inicialização', async () => {
    const pasta = path.join(__dirname, '../../migrations/fake');
    fs.mkdirSync(pasta, { recursive: true });
    try {
      fs.writeFileSync(path.join(pasta, '001_base.sql'), 'CREATE TABLE t (id INTEGER PRIMARY KEY);');
      fs.writeFileSync(path.join(pasta, '002_extra.optional.sql'), 'CREATE EXTENSION recurso_inexistente;');

      const adapter = new SqliteAdapter(':memory:');
      await adapter.conectar();
      adapter.dialect = 'fake';
      const mensagens = [];

      expect(await migrar(adapter, { log: m => mensagens.push(m) })).toEqual(['001_base.sql']);
      expect(mensagens[1]).toMatch(/002_extra\.optional\.sql ignorada/);
      // a opcional não é registrada: será tentada de novo na próxima inicialização
      expect((await adapter.all('SELECT nome FROM schema_migrations')).map(m => m.nome)).toEqual(['001_base.sql']);

      fs.writeFileSync(path.join(pasta, '003_quebrada.sql'), 'ISTO NAO E SQL;');
      await expect(migrar(adapter)).rejects.toThrow(/Falha na migration 003_quebrada\.sql/);
      await adapter.fechar();
    } finally {
      fs.rmSync(pasta, { recursive: true, force: true });
    }
  });

  test('as migrations do PostgreSQL existem e a do PostGIS é opcional', () => {
    const arquivos = fs.readdirSync(path.join(__dirname, '../../migrations/postgres')).sort();
    expect(arquivos).toEqual(['001_schema.sql', '002_postgis.optional.sql']);
    const postgis = fs.readFileSync(path.join(__dirname, '../../migrations/postgres/002_postgis.optional.sql'), 'utf8');
    expect(postgis).toMatch(/CREATE EXTENSION IF NOT EXISTS postgis/);
    expect(postgis).toMatch(/geometry\(Point, 4326\)/);
  });
});

describe('atualização de um banco criado pela versão anterior', () => {
  test('remove registros órfãos (id 0), conserta as contas de demonstração e mantém os dados válidos', async () => {
    // Banco no estado deixado pela versão antiga: filhos gravados com id 0 e hash de senha inválido
    const SQL = await initSqlJs();
    const legado = new SQL.Database();
    legado.run(fs.readFileSync(path.join(__dirname, '../../migrations/sqlite/001_schema.sql'), 'utf8'));
    legado.run(`
      INSERT INTO criterios (id, codigo, nome, tipo, peso) VALUES (1, 'C1', 'Critério 1', 'custo', 1.0);
      INSERT INTO municipios (id, nome, uf, latitude, longitude) VALUES (1, 'Salvador', 'BA', -12.9, -38.5);
      INSERT INTO municipios (id, nome, uf, latitude, longitude) VALUES (2, 'Irecê', 'BA', -11.3, -41.8);
      INSERT INTO matriz_decisao (municipio_id, criterio_id, valor) VALUES (1, 1, 1.8);
      INSERT INTO matriz_decisao (municipio_id, criterio_id, valor) VALUES (0, 1, 5.0);
      INSERT INTO usuarios (id, nome, email, senha_hash, perfil) VALUES (1, 'Admin', 'admin@topsis.gov.br', '${HASH_LEGADO_INVALIDO}', 'admin');
      INSERT INTO simulacoes (id, usuario_id, titulo, parametros) VALUES (1, 1, 'Sem resultados', '{}');
      INSERT INTO simulacoes (id, usuario_id, titulo, parametros) VALUES (2, 1, 'Sem resultados 2', '{}');
      INSERT INTO resultados_ranking (simulacao_id, municipio_id, coeficiente_ci, distancia_positiva, distancia_negativa, posicao) VALUES (0, 1, 0.5, 0.1, 0.1, 1);
      INSERT INTO resultados_ranking (simulacao_id, municipio_id, coeficiente_ci, distancia_positiva, distancia_negativa, posicao) VALUES (0, 1, 0.6, 0.1, 0.1, 1);
    `);
    const pasta = pastaTemporaria();
    const arquivo = path.join(pasta, 'database.sqlite');
    fs.writeFileSync(arquivo, Buffer.from(legado.export()));
    legado.close();

    let db;
    let app;
    let simulacaoId;
    const urlOriginal = process.env.DATABASE_URL;
    delete process.env.DATABASE_URL; // este cenário é específico do SQLite em arquivo
    jest.isolateModules(() => {
      process.env.DB_PATH = arquivo;
      db = require('../../src/database/db');
      app = require('../../src/app');
    });
    process.env.DB_PATH = ':memory:';
    if (urlOriginal) process.env.DATABASE_URL = urlOriginal;

    try {
      await db.init();
      expect(db.dialect).toBe('sqlite');

      expect((await db.get('SELECT COUNT(*) AS total FROM resultados_ranking')).total).toBe(0);
      expect((await db.get('SELECT COUNT(*) AS total FROM simulacoes')).total).toBe(0);
      expect(await db.all('SELECT municipio_id, valor FROM matriz_decisao')).toEqual([{ municipio_id: 1, valor: 1.8 }]);
      // os dados existentes são preservados e os seeds NÃO são reaplicados por cima
      expect((await db.all('SELECT nome FROM municipios ORDER BY id')).map(m => m.nome)).toEqual(['Salvador', 'Irecê']);
      expect((await db.get('SELECT COUNT(*) AS total FROM usuarios')).total).toBe(1);

      const request = require('supertest');
      const login = await request(app).post('/api/auth/login').send({ email: 'admin@topsis.gov.br', senha: '123456' });
      expect(login.status).toBe(200);

      // e o fluxo completo volta a funcionar sobre o banco migrado
      const token = login.body.token;
      await request(app).put('/api/municipios/2').set('Authorization', `Bearer ${token}`).send({ indicadores: { C1: 9.5 } });
      const sim = await request(app).post('/api/topsis/executar').set('Authorization', `Bearer ${token}`).send({});
      simulacaoId = sim.body.simulacaoId;
      expect(simulacaoId).toBeGreaterThan(0);
      expect(sim.body.ranking.map(r => r.nome)).toEqual(['Salvador', 'Irecê']);
    } finally {
      await db.close();
    }

    // tudo ficou gravado no arquivo, com os resultados vinculados à simulação
    const reaberto = new SqliteAdapter(arquivo);
    await reaberto.conectar();
    expect(await reaberto.all('SELECT simulacao_id FROM resultados_ranking')).toEqual([
      { simulacao_id: simulacaoId }, { simulacao_id: simulacaoId }
    ]);
    await reaberto.fechar();
  });

  test('semear não roda duas vezes e repararHashLegado não altera senhas válidas', async () => {
    const adapter = new SqliteAdapter(':memory:');
    await adapter.conectar();
    await migrar(adapter);

    expect(await adapter.transaction(tx => semear(tx))).toBe(true);
    expect(await adapter.transaction(tx => semear(tx))).toBe(false);
    expect((await adapter.get('SELECT COUNT(*) AS total FROM municipios')).total).toBe(13);
    expect((await adapter.get('SELECT COUNT(*) AS total FROM matriz_decisao')).total).toBe(91);
    expect(await adapter.transaction(tx => repararHashLegado(tx))).toBe(0);
    await adapter.fechar();
  });
});

describe('PostgresAdapter (com pool simulado)', () => {
  function poolSimulado() {
    const comandos = [];
    const cliente = {
      query: jest.fn(async (sql, params) => {
        comandos.push(params ? [sql, params] : sql);
        if (/falhar/.test(sql)) throw new Error('erro de SQL');
        return { rows: [{ id: 7 }], rowCount: 1 };
      }),
      release: jest.fn()
    };
    const pool = {
      query: cliente.query,
      connect: jest.fn(async () => cliente),
      end: jest.fn(async () => {})
    };
    return { pool, cliente, comandos };
  }

  test('converte os marcadores ? para $1, $2... na ordem', () => {
    expect(PostgresAdapter.converterMarcadores('SELECT * FROM t WHERE a = ? AND b IN (?, ?)'))
      .toBe('SELECT * FROM t WHERE a = $1 AND b IN ($2, $3)');
    expect(PostgresAdapter.converterMarcadores('SELECT 1')).toBe('SELECT 1');
  });

  test('all, get, run e exec delegam ao pool com os marcadores convertidos', async () => {
    const { pool, comandos } = poolSimulado();
    const adapter = new PostgresAdapter('postgres://x', { criarPool: () => pool });

    expect(adapter.dialect).toBe('postgres');
    expect(await adapter.all('SELECT * FROM t WHERE a = ?', [1])).toEqual([{ id: 7 }]);
    expect(await adapter.get('INSERT INTO t (a) VALUES (?) RETURNING id', [1])).toEqual({ id: 7 });
    expect(await adapter.run('UPDATE t SET a = ? WHERE id = ?', [2, 7])).toEqual({ changes: 1 });
    await adapter.exec('CREATE TABLE x (id INT)');
    await adapter.truncar(['a', 'b']);
    await adapter.fechar();

    expect(comandos).toEqual([
      ['SELECT * FROM t WHERE a = $1', [1]],
      ['INSERT INTO t (a) VALUES ($1) RETURNING id', [1]],
      ['UPDATE t SET a = $1 WHERE id = $2', [2, 7]],
      'CREATE TABLE x (id INT)',
      'TRUNCATE a, b RESTART IDENTITY CASCADE'
    ]);
    expect(pool.end).toHaveBeenCalled();
  });

  test('get devolve null quando não há linhas', async () => {
    const pool = { query: jest.fn(async () => ({ rows: [], rowCount: 0 })) };
    const adapter = new PostgresAdapter('postgres://x', { criarPool: () => pool });
    expect(await adapter.get('SELECT 1 WHERE false')).toBeNull();
  });

  test('transação: BEGIN/COMMIT em um único cliente, que é sempre devolvido ao pool', async () => {
    const { pool, cliente, comandos } = poolSimulado();
    const adapter = new PostgresAdapter('postgres://x', { criarPool: () => pool });

    const resultado = await adapter.transaction(async (tx) => {
      await tx.run('INSERT INTO t (a) VALUES (?)', [1]);
      await tx.exec('SELECT 2');
      return (await tx.get('SELECT ?', [3])).id + (await tx.all('SELECT 4')).length;
    });

    expect(resultado).toBe(8);
    expect(comandos[0]).toBe('BEGIN');
    expect(comandos[comandos.length - 1]).toBe('COMMIT');
    expect(cliente.release).toHaveBeenCalledTimes(1);
  });

  test('transação: ROLLBACK quando a função falha, propagando o erro', async () => {
    const { pool, cliente, comandos } = poolSimulado();
    const adapter = new PostgresAdapter('postgres://x', { criarPool: () => pool });

    await expect(adapter.transaction(tx => tx.run('falhar'))).rejects.toThrow('erro de SQL');
    expect(comandos).toEqual(['BEGIN', ['falhar', []], 'ROLLBACK']);
    expect(cliente.release).toHaveBeenCalledTimes(1);
  });

  test('conectar tenta novamente enquanto o banco inicializa e desiste após o limite', async () => {
    let chamadas = 0;
    const pool = {
      query: jest.fn(async () => {
        chamadas++;
        if (chamadas < 3) throw new Error('the database system is starting up');
        return { rows: [] };
      })
    };
    const adapter = new PostgresAdapter('postgres://x', { criarPool: () => pool });
    await adapter.conectar({ tentativas: 5, intervaloMs: 1 });
    expect(chamadas).toBe(3);

    const semBanco = new PostgresAdapter('postgres://x', {
      criarPool: () => ({ query: jest.fn(async () => { throw new Error('ECONNREFUSED'); }) })
    });
    await expect(semBanco.conectar({ tentativas: 2, intervaloMs: 1 })).rejects.toThrow(/Não foi possível conectar ao PostgreSQL: ECONNREFUSED/);
  });

  test('sem pool injetado cria um Pool do driver pg (sem conectar ainda)', async () => {
    const adapter = new PostgresAdapter('postgres://usuario:senha@localhost:5432/banco');
    expect(adapter.pool.options.connectionString).toContain('localhost:5432');
    await adapter.fechar();
  });

  test('a queda de uma conexão ociosa é registrada, sem derrubar o processo', async () => {
    const consoleErro = jest.spyOn(console, 'error').mockImplementation(() => {});
    const adapter = new PostgresAdapter('postgres://usuario:senha@localhost:5432/banco');
    try {
      expect(() => adapter.pool.emit('error', new Error('terminating connection'))).not.toThrow();
      expect(consoleErro).toHaveBeenCalledWith(expect.stringContaining('terminating connection'));
    } finally {
      consoleErro.mockRestore();
      await adapter.fechar();
    }
  });
});
