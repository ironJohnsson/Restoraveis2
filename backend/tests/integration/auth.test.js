const jwt = require('jsonwebtoken');
const config = require('../../src/config/config');
const { prepararApi, login, CONTAS } = require('../helpers/api');

describe('Autenticação (RF08 / RNF04)', () => {
  const api = prepararApi();

  test('GET /api/status é público e informa as normas de referência', async () => {
    const res = await api.get('/api/status');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('online');
    expect(res.body.normas).toContain('ISO/IEC 25010');
  });

  test('login com credenciais válidas devolve token JWT e dados do usuário, sem o hash da senha', async () => {
    const res = await api.post('/api/auth/login', { email: CONTAS.admin, senha: '123456' });
    expect(res.status).toBe(200);
    expect(res.body.sucesso).toBe(true);
    expect(res.body.usuario).toEqual(expect.objectContaining({ email: CONTAS.admin, perfil: 'admin' }));
    expect(JSON.stringify(res.body)).not.toMatch(/senha_hash|\$2[aby]\$/);

    const payload = jwt.verify(res.body.token, config.jwtSecret);
    expect(payload.perfil).toBe('admin');
    expect(payload.exp).toBeGreaterThan(payload.iat);
  });

  test('e-mail é aceito sem diferenciar maiúsculas', async () => {
    const res = await api.post('/api/auth/login', { email: 'ADMIN@Topsis.gov.br', senha: '123456' });
    expect(res.status).toBe(200);
  });

  test('senha errada e usuário inexistente recebem o mesmo 401 genérico', async () => {
    const senhaErrada = await api.post('/api/auth/login', { email: CONTAS.admin, senha: 'senha-errada' });
    const inexistente = await api.post('/api/auth/login', { email: 'ninguem@topsis.gov.br', senha: '123456' });
    expect(senhaErrada.status).toBe(401);
    expect(inexistente.status).toBe(401);
    expect(senhaErrada.body.mensagem).toBe('Credenciais inválidas');
    expect(inexistente.body.mensagem).toBe(senhaErrada.body.mensagem);
    expect(senhaErrada.body.token).toBeUndefined();
  });

  test('regressão: "123456" não funciona como senha mestra de outras contas', async () => {
    const criado = await api.post('/api/usuarios', {
      nome: 'Maria Souza', email: 'maria@topsis.gov.br', senha: 'SenhaForte!987', perfil: 'gestor'
    }, api.admin);
    expect(criado.status).toBe(201);

    const comSenhaPadrao = await api.post('/api/auth/login', { email: 'maria@topsis.gov.br', senha: '123456' });
    expect(comSenhaPadrao.status).toBe(401);

    const comSenhaCorreta = await api.post('/api/auth/login', { email: 'maria@topsis.gov.br', senha: 'SenhaForte!987' });
    expect(comSenhaCorreta.status).toBe(200);
    expect(comSenhaCorreta.body.usuario.perfil).toBe('gestor');
  });

  test('login exige email e senha em texto', async () => {
    expect((await api.post('/api/auth/login', {})).status).toBe(400);
    expect((await api.post('/api/auth/login', { email: CONTAS.admin })).status).toBe(400);
    expect((await api.post('/api/auth/login', { email: { $ne: null }, senha: { $ne: null } })).status).toBe(400);
  });

  test('não existe cadastro público de usuários', async () => {
    const corpo = { nome: 'Zé', email: 'ze@x.com', senha: 'SenhaForte!987', perfil: 'admin' };
    expect((await api.post('/api/auth/register', corpo)).status).toBe(401);
    expect((await api.post('/api/auth/register', corpo, api.admin)).status).toBe(404);
    expect((await api.post('/api/auth/login', { email: 'ze@x.com', senha: 'SenhaForte!987' })).status).toBe(401);
  });

  test('GET /api/auth/me devolve o usuário do token', async () => {
    const res = await api.get('/api/auth/me', api.pesquisador);
    expect(res.status).toBe(200);
    expect(res.body.usuario).toEqual(expect.objectContaining({ email: CONTAS.pesquisador, perfil: 'pesquisador' }));
    expect(res.body.usuario.senha_hash).toBeUndefined();
  });

  test('rejeita requisição sem token, com cabeçalho malformado ou token inválido', async () => {
    expect((await api.get('/api/auth/me')).status).toBe(401);
    expect((await api.get('/api/auth/me').set('Authorization', api.admin)).status).toBe(401);
    expect((await api.get('/api/auth/me').set('Authorization', `Basic ${api.admin}`)).status).toBe(401);
    expect((await api.get('/api/auth/me', 'token.invalido.aqui')).status).toBe(401);
  });

  test('rejeita token expirado e token assinado com outro segredo', async () => {
    const payload = { id: 1, nome: 'x', email: CONTAS.admin, perfil: 'admin' };
    const expirado = jwt.sign(payload, config.jwtSecret, { expiresIn: -10 });
    const forjado = jwt.sign(payload, 'outro-segredo');

    expect((await api.get('/api/municipios', expirado)).status).toBe(401);
    expect((await api.get('/api/municipios', forjado)).status).toBe(401);
  });

  test('token de um usuário excluído deixa de valer imediatamente', async () => {
    const criado = await api.post('/api/usuarios', {
      nome: 'Temporário', email: 'temp@topsis.gov.br', senha: 'SenhaForte!987', perfil: 'gestor'
    }, api.admin);
    const token = await login('temp@topsis.gov.br', 'SenhaForte!987');
    expect((await api.get('/api/municipios', token)).status).toBe(200);

    await api.delete(`/api/usuarios/${criado.body.usuarioId}`, api.admin);
    expect((await api.get('/api/municipios', token)).status).toBe(401);
  });

  test('o perfil vale o do banco, não o gravado no token (rebaixamento tem efeito imediato)', async () => {
    const criado = await api.post('/api/usuarios', {
      nome: 'Ex Admin', email: 'exadmin@topsis.gov.br', senha: 'SenhaForte!987', perfil: 'admin'
    }, api.admin);
    const token = await login('exadmin@topsis.gov.br', 'SenhaForte!987');
    expect((await api.get('/api/usuarios', token)).status).toBe(200);

    await api.put(`/api/usuarios/${criado.body.usuarioId}`, { perfil: 'gestor' }, api.admin);
    expect((await api.get('/api/usuarios', token)).status).toBe(403);
  });

  test('PUT /api/auth/senha troca a própria senha exigindo a senha atual', async () => {
    await api.post('/api/usuarios', {
      nome: 'Troca Senha', email: 'troca@topsis.gov.br', senha: 'SenhaAntiga!1', perfil: 'pesquisador'
    }, api.admin);
    const token = await login('troca@topsis.gov.br', 'SenhaAntiga!1');

    expect((await api.put('/api/auth/senha', { novaSenha: 'SenhaNova!2345' }, token)).status).toBe(400);
    expect((await api.put('/api/auth/senha', { senhaAtual: 'errada', novaSenha: 'SenhaNova!2345' }, token)).status).toBe(401);
    expect((await api.put('/api/auth/senha', { senhaAtual: 'SenhaAntiga!1', novaSenha: 'curta' }, token)).status).toBe(400);

    const ok = await api.put('/api/auth/senha', { senhaAtual: 'SenhaAntiga!1', novaSenha: 'SenhaNova!2345' }, token);
    expect(ok.status).toBe(200);

    expect(await login('troca@topsis.gov.br', 'SenhaAntiga!1')).toBeUndefined();
    expect(await login('troca@topsis.gov.br', 'SenhaNova!2345')).toEqual(expect.any(String));
  });
});
