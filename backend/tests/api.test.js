const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
const http = require('node:http');
const app = require('../src/app');
const db = require('../src/database/db');

let server;
let baseUrl;

function request(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch (e) {
          json = data;
        }
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: json,
          raw: data
        });
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

describe('Testes de Integração da API RESTful (Capítulos 5 e 10)', () => {
  before(async () => {
    await db.getDb();
    server = app.listen(0); // porta aleatória disponível
    const port = server.address().port;
    baseUrl = `http://127.0.0.1:${port}`;
  });

  after(() => {
    server.close();
  });

  it('GET /api/status - Deve retornar status online e conformidade ISO', async () => {
    const res = await request('GET', '/api/status');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.status, 'online');
    assert.strictEqual(res.body.normas.includes('ISO/IEC 25010'), true);
  });

  it('POST /api/auth/login - Deve autenticar usuário cadastrado e retornar token JWT', async () => {
    const res = await request('POST', '/api/auth/login', {
      email: 'admin@topsis.gov.br',
      senha: '123456'
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.sucesso, true);
    assert.strictEqual(typeof res.body.token, 'string');
    assert.strictEqual(res.body.usuario.perfil, 'admin');
  });

  it('GET /api/municipios - Deve retornar lista de municípios com indicadores', async () => {
    const res = await request('GET', '/api/municipios');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.sucesso, true);
    assert.strictEqual(res.body.total >= 3, true);
    const primeiro = res.body.dados[0];
    assert.strictEqual(typeof primeiro.nome, 'string');
    assert.strictEqual(typeof primeiro.indicadores, 'object');
  });

  it('GET /api/criterios - Deve retornar 7 critérios do modelo de vulnerabilidade', async () => {
    const res = await request('GET', '/api/criterios');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.total, 7);
    const codigos = res.body.dados.map(c => c.codigo);
    assert.strictEqual(codigos.includes('C1'), true);
    assert.strictEqual(codigos.includes('C5'), true);
  });

  it('POST /api/topsis/executar - Deve calcular o ranking TOPSIS e persistir a simulação', async () => {
    const res = await request('POST', '/api/topsis/executar', {
      titulo: 'Teste de Integração Automatizado',
      pesosPersonalizados: { C1: 0.2, C2: 0.2, C3: 0.15, C4: 0.25, C5: 0.2 }
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.sucesso, true);
    assert.strictEqual(typeof res.body.simulacaoId, 'number');
    assert.strictEqual(res.body.ranking.length > 0, true);

    // Valida que o tempo de execução é < 3000ms (atendendo ao RNF01)
    assert.strictEqual(res.body.tempoExecucaoMs < 3000, true, 'O tempo deve ser menor que 3000ms');

    // Valida existência de campos nas alternativas ranqueadas
    const top1 = res.body.ranking[0];
    assert.strictEqual(typeof top1.ci, 'number');
    assert.strictEqual(typeof top1.distanciaPositiva, 'number');
    assert.strictEqual(typeof top1.distanciaNegativa, 'number');
    assert.strictEqual(top1.posicao, 1);
  });

  it('GET /api/relatorios/:id/csv - Deve gerar e retornar arquivo CSV com cabeçalhos', async () => {
    const res = await request('GET', '/api/relatorios/1/csv');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.raw.includes('Posição;Município;UF;População;IDH;Coeficiente Ci'), true);
  });
});
