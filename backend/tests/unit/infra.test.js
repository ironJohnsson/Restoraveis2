const fs = require('fs');
const os = require('os');
const path = require('path');
const errorHandler = require('../../src/middlewares/errorHandler');
const { requireRole } = require('../../src/middlewares/auth');
const HttpError = require('../../src/utils/HttpError');

function respostaSimulada() {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  return res;
}

describe('errorHandler', () => {
  const req = { method: 'GET', originalUrl: '/api/teste' };

  test('HttpError devolve o status, a mensagem e os detalhes', () => {
    const res = respostaSimulada();
    errorHandler(new HttpError(409, 'Conflito', { campo: 'nome' }), req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ sucesso: false, mensagem: 'Conflito', detalhes: { campo: 'nome' } });
  });

  test('erro inesperado vira 500 genérico, sem expor detalhes internos', () => {
    const res = respostaSimulada();
    errorHandler(new Error('SQLITE_CONSTRAINT: detalhes internos do banco'), req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ sucesso: false, mensagem: 'Erro interno no servidor', detalhes: undefined });
  });

  test('em desenvolvimento registra o erro no console e inclui a pilha na resposta', () => {
    const ambiente = process.env.NODE_ENV;
    const consoleErro = jest.spyOn(console, 'error').mockImplementation(() => {});
    process.env.NODE_ENV = 'development';
    try {
      const res = respostaSimulada();
      errorHandler(new Error('falha'), req, res, jest.fn());
      expect(consoleErro).toHaveBeenCalledWith(expect.stringContaining('GET /api/teste'));
      expect(res.json.mock.calls[0][0].detalhes).toContain('Error: falha');
    } finally {
      process.env.NODE_ENV = ambiente;
      consoleErro.mockRestore();
    }
  });

  test('erros 4xx do Express têm mensagem amigável', () => {
    const casos = [
      [{ status: 413, type: 'entity.too.large' }, 'Corpo da requisição excede o tamanho máximo permitido'],
      [{ status: 400, type: 'entity.parse.failed' }, 'Corpo da requisição com JSON inválido'],
      [{ status: 415, type: 'charset.unsupported' }, 'Requisição inválida']
    ];
    casos.forEach(([erro, mensagem]) => {
      const res = respostaSimulada();
      errorHandler(erro, req, res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(erro.status);
      expect(res.json).toHaveBeenCalledWith({ sucesso: false, mensagem });
    });
  });
});

describe('requireRole', () => {
  test('sem usuário autenticado encaminha 401', () => {
    const next = jest.fn();
    requireRole('admin')({}, {}, next);
    expect(next.mock.calls[0][0]).toEqual(expect.objectContaining({ status: 401 }));
  });
});

describe('configuração', () => {
  function carregarConfig(variaveis) {
    const anteriores = {};
    Object.keys(variaveis).forEach((chave) => {
      anteriores[chave] = process.env[chave];
      if (variaveis[chave] === undefined) delete process.env[chave];
      else process.env[chave] = variaveis[chave];
    });
    try {
      let config;
      jest.isolateModules(() => { config = require('../../src/config/config'); });
      return config;
    } finally {
      Object.keys(anteriores).forEach((chave) => {
        if (anteriores[chave] === undefined) delete process.env[chave];
        else process.env[chave] = anteriores[chave];
      });
    }
  }

  test('JWT_SECRET do ambiente tem prioridade', () => {
    expect(carregarConfig({ JWT_SECRET: 'segredo-do-ambiente' }).jwtSecret).toBe('segredo-do-ambiente');
  });

  test('sem JWT_SECRET, gera um segredo aleatório e o reutiliza a partir de data/.jwt_secret', () => {
    const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'topsis-config-'));
    const variaveis = { JWT_SECRET: undefined, NODE_ENV: 'production', DATA_DIR: dataDir, DB_PATH: undefined };

    const primeira = carregarConfig(variaveis);
    expect(primeira.jwtSecret).toMatch(/^[0-9a-f]{96}$/);
    expect(fs.readFileSync(path.join(dataDir, '.jwt_secret'), 'utf8')).toBe(primeira.jwtSecret);
    expect(primeira.dbPath).toBe(path.join(dataDir, 'database.sqlite'));
    expect(primeira.bcryptRounds).toBe(10);

    expect(carregarConfig(variaveis).jwtSecret).toBe(primeira.jwtSecret);
  });

  test('DATABASE_URL seleciona o PostgreSQL; CORS_ORIGIN aceita lista separada por vírgula', () => {
    const config = carregarConfig({
      DATABASE_URL: 'postgres://u:s@db:5432/topsis', CORS_ORIGIN: 'https://a.gov.br, https://b.gov.br', TRUST_PROXY: '1'
    });
    expect(config.databaseUrl).toBe('postgres://u:s@db:5432/topsis');
    expect(config.corsOrigins).toEqual(['https://a.gov.br', 'https://b.gov.br']);
    expect(config.trustProxy).toBe(1);
  });
});

describe('inicialização do servidor e do banco', () => {
  test('iniciarServidor prepara o banco e passa a aceitar requisições', async () => {
    const log = jest.spyOn(console, 'log').mockImplementation(() => {});
    const { iniciarServidor } = require('../../src/server');
    const db = require('../../src/database/db');
    const server = await iniciarServidor(0);
    try {
      const res = await fetch(`http://127.0.0.1:${server.address().port}/api/status`);
      expect((await res.json()).status).toBe('online');
      expect(log).toHaveBeenCalledWith(expect.stringContaining('Servidor ouvindo na porta'));
    } finally {
      await new Promise(resolve => server.close(resolve));
      await db.close();
      log.mockRestore();
    }
  });

  test('falha ao inicializar o banco é propagada e uma nova tentativa é possível', async () => {
    let db;
    const urlOriginal = process.env.DATABASE_URL;
    jest.isolateModules(() => {
      process.env.DATABASE_URL = 'postgres://usuario:senha@127.0.0.1:1/inexistente';
      jest.doMock('../../src/database/adapters/postgres', () => class {
        constructor() { this.dialect = 'postgres'; }
        async conectar() { throw new Error('Não foi possível conectar ao PostgreSQL: ECONNREFUSED'); }
      });
      db = require('../../src/database/db');
    });
    if (urlOriginal) process.env.DATABASE_URL = urlOriginal;
    else delete process.env.DATABASE_URL;

    await expect(db.init()).rejects.toThrow(/Não foi possível conectar ao PostgreSQL/);
    await expect(db.all('SELECT 1')).rejects.toThrow(/Não foi possível conectar ao PostgreSQL/);
    expect(db.dialect).toBe('postgres');
    await db.close();
  });
});
