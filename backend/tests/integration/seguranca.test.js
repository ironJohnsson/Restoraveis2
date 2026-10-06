const { prepararApi } = require('../helpers/api');

/**
 * Matriz de controle de acesso por perfil (RBAC), conforme os atores dos casos de uso:
 * UC01 Administrador; UC02 Pesquisador; UC03 Pesquisador e Gestor; UC04 Gestor Público.
 */
const TODOS = ['admin', 'pesquisador', 'gestor'];
const ROTAS = [
  ['get', '/api/auth/me', TODOS],
  ['put', '/api/auth/senha', TODOS],
  ['get', '/api/usuarios', ['admin']],
  ['post', '/api/usuarios', ['admin']],
  ['put', '/api/usuarios/999', ['admin']],
  ['delete', '/api/usuarios/999', ['admin']],
  ['get', '/api/municipios', TODOS],
  ['get', '/api/municipios/999', TODOS],
  ['post', '/api/municipios', ['admin']],
  ['put', '/api/municipios/999', ['admin']],
  ['delete', '/api/municipios/999', ['admin']],
  ['get', '/api/criterios', TODOS],
  ['post', '/api/criterios', ['admin', 'pesquisador']],
  ['put', '/api/criterios/pesos', ['admin', 'pesquisador']],
  ['put', '/api/criterios/999', ['admin', 'pesquisador']],
  ['delete', '/api/criterios/999', ['admin', 'pesquisador']],
  ['post', '/api/topsis/executar', TODOS],
  ['get', '/api/topsis/simulacoes', TODOS],
  ['get', '/api/topsis/simulacoes/999', TODOS],
  ['get', '/api/simulacoes', TODOS],
  ['get', '/api/simulacoes/999', TODOS],
  ['get', '/api/relatorios/999/csv', TODOS],
  ['get', '/api/relatorios/999/pdf', TODOS],
  ['get', '/api/importacao/modelo.csv', ['admin']],
  ['post', '/api/importacao/municipios', ['admin']],
  ['get', '/api/importacao/ibge/municipios', ['admin']],
  ['get', '/api/importacao/ibge/municipios/123', ['admin']],
  ['get', '/api/importacao/cep/123', ['admin']]
];

describe('Segurança — todas as rotas exigem token e respeitam o perfil (RNF04)', () => {
  const api = prepararApi();

  const chamar = (metodo, rota, token) => (metodo === 'get' || metodo === 'delete'
    ? api[metodo](rota, token)
    : api[metodo](rota, {}, token));

  test.each(ROTAS)('%s %s sem token responde 401', async (metodo, rota) => {
    const res = await chamar(metodo, rota);
    expect(res.status).toBe(401);
    expect(res.body.sucesso).toBe(false);
  });

  test.each(ROTAS)('%s %s autoriza apenas os perfis previstos', async (metodo, rota, permitidos) => {
    for (const perfil of TODOS) {
      const res = await chamar(metodo, rota, api[perfil]);
      if (permitidos.includes(perfil)) {
        expect([401, 403]).not.toContain(res.status);
      } else {
        expect(res.status).toBe(403);
      }
    }
  });

  test('nenhuma resposta expõe o cabeçalho X-Powered-By', async () => {
    const res = await api.get('/api/status');
    expect(res.headers['x-powered-by']).toBeUndefined();
  });

  test('CORS só libera as origens configuradas', async () => {
    const permitida = await api.get('/api/status').set('Origin', 'http://localhost:3000');
    const estranha = await api.get('/api/status').set('Origin', 'http://site-malicioso.example');
    expect(permitida.headers['access-control-allow-origin']).toBe('http://localhost:3000');
    expect(estranha.headers['access-control-allow-origin']).toBeUndefined();
  });
});
