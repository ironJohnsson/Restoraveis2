const { prepararApi, login, CONTAS } = require('../helpers/api');

describe('Usuários e perfis de acesso (RF08)', () => {
  const api = prepararApi();
  const novo = { nome: 'Ana Lima', email: 'ana@topsis.gov.br', senha: 'SenhaForte!987', perfil: 'gestor' };
  let anaId;

  test('lista os usuários sem expor o hash da senha', async () => {
    const res = await api.get('/api/usuarios', api.admin);
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(3);
    expect(res.body.dados.map(u => u.perfil).sort()).toEqual(['admin', 'gestor', 'pesquisador']);
    res.body.dados.forEach(u => expect(u.senha_hash).toBeUndefined());
  });

  test('cadastra usuário com perfil e permite o login', async () => {
    const res = await api.post('/api/usuarios', novo, api.admin);
    expect(res.status).toBe(201);
    expect(res.body.usuarioId).toBeGreaterThan(0);
    anaId = res.body.usuarioId;

    const lista = await api.get('/api/usuarios', api.admin);
    expect(lista.body.dados.find(u => u.id === anaId)).toEqual(expect.objectContaining({ email: novo.email, perfil: 'gestor' }));
    expect(await login(novo.email, novo.senha)).toEqual(expect.any(String));
  });

  test('perfil padrão é pesquisador', async () => {
    const res = await api.post('/api/usuarios', { nome: 'Sem Perfil', email: 'semperfil@topsis.gov.br', senha: 'SenhaForte!987' }, api.admin);
    const lista = await api.get('/api/usuarios', api.admin);
    expect(lista.body.dados.find(u => u.id === res.body.usuarioId).perfil).toBe('pesquisador');
  });

  test('valida os dados do cadastro', async () => {
    const casos = [
      { ...novo, email: 'outro@topsis.gov.br', nome: '' },
      { ...novo, email: 'email-invalido' },
      { ...novo, email: 'outro@topsis.gov.br', senha: '1234567' },
      { ...novo, email: 'outro@topsis.gov.br', perfil: 'superusuario' },
      { nome: 'Sem senha', email: 'outro@topsis.gov.br' }
    ];
    for (const corpo of casos) {
      expect((await api.post('/api/usuarios', corpo, api.admin)).status).toBe(400);
    }
  });

  test('não permite e-mail duplicado (sem diferenciar maiúsculas)', async () => {
    const res = await api.post('/api/usuarios', { ...novo, email: 'ANA@topsis.gov.br' }, api.admin);
    expect(res.status).toBe(409);
  });

  test('atualiza nome, perfil e redefine a senha', async () => {
    const res = await api.put(`/api/usuarios/${anaId}`, { nome: 'Ana Lima Santos', perfil: 'pesquisador', senha: 'OutraSenha!456' }, api.admin);
    expect(res.status).toBe(200);

    const lista = await api.get('/api/usuarios', api.admin);
    expect(lista.body.dados.find(u => u.id === anaId)).toEqual(expect.objectContaining({ nome: 'Ana Lima Santos', perfil: 'pesquisador', email: novo.email }));
    expect(await login(novo.email, novo.senha)).toBeUndefined();
    expect(await login(novo.email, 'OutraSenha!456')).toEqual(expect.any(String));
  });

  test('atualização parcial não altera a senha', async () => {
    await api.put(`/api/usuarios/${anaId}`, { nome: 'Ana L. Santos' }, api.admin);
    expect(await login(novo.email, 'OutraSenha!456')).toEqual(expect.any(String));
  });

  test('atualização valida e-mail em uso, dados inválidos e usuário inexistente', async () => {
    expect((await api.put(`/api/usuarios/${anaId}`, { email: CONTAS.gestor }, api.admin)).status).toBe(409);
    expect((await api.put(`/api/usuarios/${anaId}`, { email: 'ana.nova@topsis.gov.br' }, api.admin)).status).toBe(200);
    expect((await api.put(`/api/usuarios/${anaId}`, { perfil: 'root' }, api.admin)).status).toBe(400);
    expect((await api.put(`/api/usuarios/${anaId}`, { senha: 'curta' }, api.admin)).status).toBe(400);
    expect((await api.put('/api/usuarios/99999', { nome: 'X' }, api.admin)).status).toBe(404);
    expect((await api.put('/api/usuarios/abc', { nome: 'X' }, api.admin)).status).toBe(400);
  });

  test('o único administrador não pode ser rebaixado nem excluído, nem excluir a si mesmo', async () => {
    const me = await api.get('/api/auth/me', api.admin);
    const adminId = me.body.usuario.id;

    expect((await api.put(`/api/usuarios/${adminId}`, { perfil: 'gestor' }, api.admin)).status).toBe(409);
    expect((await api.delete(`/api/usuarios/${adminId}`, api.admin)).status).toBe(409);

    // Com um segundo administrador, o primeiro pode ser excluído por ele (mas não por si mesmo)
    const segundo = await api.post('/api/usuarios', { nome: 'Admin 2', email: 'admin2@topsis.gov.br', senha: 'SenhaForte!987', perfil: 'admin' }, api.admin);
    expect((await api.delete(`/api/usuarios/${adminId}`, api.admin)).status).toBe(409);
    expect((await api.put(`/api/usuarios/${segundo.body.usuarioId}`, { perfil: 'gestor' }, api.admin)).status).toBe(200);
  });

  test('exclui usuário e responde 404 para id inexistente', async () => {
    expect((await api.delete(`/api/usuarios/${anaId}`, api.admin)).status).toBe(200);
    expect((await api.delete(`/api/usuarios/${anaId}`, api.admin)).status).toBe(404);
    expect(await login('ana.nova@topsis.gov.br', 'OutraSenha!456')).toBeUndefined();
  });

  test('simulações de um usuário excluído permanecem no histórico', async () => {
    const criado = await api.post('/api/usuarios', { nome: 'Autor', email: 'autor@topsis.gov.br', senha: 'SenhaForte!987', perfil: 'pesquisador' }, api.admin);
    const token = await login('autor@topsis.gov.br', 'SenhaForte!987');
    const sim = await api.post('/api/topsis/executar', { titulo: 'Do autor' }, token);

    await api.delete(`/api/usuarios/${criado.body.usuarioId}`, api.admin);

    const res = await api.get(`/api/simulacoes/${sim.body.simulacaoId}`, api.admin);
    expect(res.status).toBe(200);
    expect(res.body.dados.usuarioNome).toBeNull();
    expect(res.body.dados.ranking.length).toBe(13);
  });
});
