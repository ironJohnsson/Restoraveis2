const request = require('supertest');
const { prepararApi } = require('../helpers/api');
const openapi = require('../../src/docs/openapi');

/** Percorre os roteadores do Express e devolve ["GET /api/municipios/{id}", ...]. */
function listarRotas(pilha, prefixo = '') {
  const rotas = [];
  for (const camada of pilha) {
    if (camada.route) {
      const caminho = (prefixo + camada.route.path).replace(/\/$/, '').replace(/:(\w+)/g, '{$1}');
      for (const metodo of Object.keys(camada.route.methods)) {
        rotas.push(`${metodo.toUpperCase()} ${caminho}`);
      }
    } else if (camada.name === 'router' && camada.handle.stack) {
      const montagem = camada.regexp.source
        .replace('^', '')
        .replace('\\/?(?=\\/|$)', '')
        .replace(/\\\//g, '/');
      rotas.push(...listarRotas(camada.handle.stack, prefixo + montagem));
    }
  }
  return rotas;
}

describe('Documentação da API — Swagger/OpenAPI (RNF06)', () => {
  const api = prepararApi();

  test('toda rota /api do Express está documentada, e não há rota documentada inexistente', () => {
    const implementadas = listarRotas(api.app._router.stack).filter(r => r.includes(' /api/')).sort();
    const documentadas = Object.entries(openapi.paths)
      .flatMap(([caminho, operacoes]) => Object.keys(operacoes).map(m => `${m.toUpperCase()} ${caminho}`))
      .sort();

    expect(implementadas.length).toBeGreaterThan(25);
    expect(documentadas).toEqual(implementadas);
  });

  test('rotas protegidas declaram bearerAuth e as respostas 401; login e status são públicos', () => {
    for (const [caminho, operacoes] of Object.entries(openapi.paths)) {
      for (const [metodo, operacao] of Object.entries(operacoes)) {
        const publica = caminho === '/api/status' || caminho === '/api/auth/login';
        if (publica) {
          expect(operacao.security).toBeUndefined();
        } else {
          expect({ rota: `${metodo} ${caminho}`, security: operacao.security }).toEqual({ rota: `${metodo} ${caminho}`, security: [{ bearerAuth: [] }] });
          expect(operacao.responses[401]).toBeDefined();
        }
        expect(operacao.summary).toEqual(expect.any(String));
        expect(operacao.tags).toHaveLength(1);
      }
    }
  });

  test('todas as referências de schema existem', () => {
    const refs = JSON.stringify(openapi).match(/#\/components\/schemas\/\w+/g);
    new Set(refs).forEach((ref) => {
      expect(openapi.components.schemas[ref.split('/').pop()]).toBeDefined();
    });
  });

  test('GET /api-docs.json e a interface Swagger UI respondem', async () => {
    const spec = await request(api.app).get('/api-docs.json');
    expect(spec.status).toBe(200);
    expect(spec.body.openapi).toMatch(/^3\./);
    expect(spec.body.components.securitySchemes.bearerAuth.scheme).toBe('bearer');

    const ui = await request(api.app).get('/api-docs/');
    expect(ui.status).toBe(200);
    expect(ui.text).toContain('swagger-ui');
  });

  test('rota raiz informativa, 404 em JSON e JSON malformado tratado como 400', async () => {
    const raiz = await request(api.app).get('/');
    expect(raiz.body).toEqual(expect.objectContaining({ status: 'online', documentacao: '/api-docs' }));

    const inexistente = await request(api.app).get('/api/nao-existe').set('Authorization', `Bearer ${api.admin}`);
    expect(inexistente.status).toBe(404);
    expect(inexistente.body.sucesso).toBe(false);

    const malformado = await request(api.app)
      .post('/api/auth/login').set('Content-Type', 'application/json').send('{"email": ');
    expect(malformado.status).toBe(400);
    expect(malformado.body.mensagem).toBe('Corpo da requisição com JSON inválido');
  });
});
