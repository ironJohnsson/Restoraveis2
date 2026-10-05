const { prepararApi } = require('../helpers/api');

describe('Municípios e matriz de decisão (RF01 / UC01)', () => {
  const api = prepararApi();
  const irece = {
    nome: 'Irecê', uf: 'ba', codigoIbge: '2914604', populacao: 74507, idh: 0.691,
    latitude: -11.3094, longitude: -41.839,
    indicadores: { C1: 5, C2: 2, C3: 1200, C4: 0.75, C5: 5.5, C6: 15, C7: 5 }
  };
  let ireceId;

  test('lista os 13 municípios iniciais com seus indicadores', async () => {
    const res = await api.get('/api/municipios', api.gestor);
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(13);

    const salvador = res.body.dados.find(m => m.nome === 'Salvador');
    expect(salvador).toEqual(expect.objectContaining({ uf: 'BA', codigo_ibge: '2927408', populacao: 2417678 }));
    expect(salvador.indicadores).toEqual({ C1: 1.8, C2: 1.45, C3: 1720, C4: 0.78, C5: 5.4, C6: 12.1, C7: 18 });
    expect(salvador.indicadoresDetalhe).toHaveLength(7);
    expect(salvador.created_at).toMatch(/^\d{4}-\d{2}-\d{2}T.*Z$/);
  });

  test('filtra por UF e por trecho do nome, sem diferenciar maiúsculas', async () => {
    expect((await api.get('/api/municipios?uf=ba', api.gestor)).body.total).toBe(13);
    expect((await api.get('/api/municipios?uf=SP', api.gestor)).body.total).toBe(0);
    expect((await api.get('/api/municipios?busca=SALVA', api.gestor)).body.dados.map(m => m.nome)).toEqual(['Salvador']);
    expect((await api.get('/api/municipios?busca=benchmark', api.gestor)).body.total).toBe(3);
    // acentos também são ignorados na busca
    expect((await api.get('/api/municipios?busca=CAETITE', api.gestor)).body.dados.map(m => m.nome)).toEqual(['Caetité']);
    expect((await api.get('/api/municipios?busca=ilhéus', api.gestor)).body.total).toBe(1);
    expect((await api.get('/api/municipios?uf=XX', api.gestor)).status).toBe(400);
  });

  test('obtém município por id; 404 se não existe; 400 se o id é inválido', async () => {
    const salvador = await api.municipioPorNome('Salvador');
    const res = await api.get(`/api/municipios/${salvador.id}`, api.gestor);
    expect(res.status).toBe(200);
    expect(res.body.dados.indicadores.C3).toBe(1720);
    expect((await api.get('/api/municipios/99999', api.gestor)).status).toBe(404);
    expect((await api.get('/api/municipios/abc', api.gestor)).status).toBe(400);
  });

  test('regressão: o cadastro devolve o id real e grava os indicadores nesse município', async () => {
    const res = await api.post('/api/municipios', irece, api.admin);
    expect(res.status).toBe(201);
    expect(res.body.municipioId).toBeGreaterThan(13);
    ireceId = res.body.municipioId;

    const salvo = (await api.get(`/api/municipios/${ireceId}`, api.admin)).body.dados;
    expect(salvo).toEqual(expect.objectContaining({ nome: 'Irecê', uf: 'BA', codigo_ibge: '2914604', populacao: 74507, idh: 0.691 }));
    expect(salvo.indicadores).toEqual(irece.indicadores);

    // nenhum valor ficou órfão na matriz de decisão
    const orfaos = await api.db.get('SELECT COUNT(*) AS total FROM matriz_decisao WHERE municipio_id NOT IN (SELECT id FROM municipios)');
    expect(orfaos.total).toBe(0);
  });

  test('não permite município duplicado (nome + UF, sem diferenciar maiúsculas) nem código IBGE repetido', async () => {
    for (const nome of ['IRECÊ', 'irece', '  Irecê ']) {
      const duplicado = await api.post('/api/municipios', { nome, uf: 'BA', latitude: -11, longitude: -41 }, api.admin);
      expect(duplicado.status).toBe(409);
    }

    const mesmoCodigo = await api.post('/api/municipios', { nome: 'Outro', uf: 'BA', codigoIbge: '2914604', latitude: -11, longitude: -41 }, api.admin);
    expect(mesmoCodigo.status).toBe(409);
  });

  test('o mesmo nome pode existir em UFs diferentes', async () => {
    const res = await api.post('/api/municipios', { nome: 'Bom Jesus da Lapa', uf: 'PI', latitude: -9.07, longitude: -44.36 }, api.admin);
    expect(res.status).toBe(201);
  });

  test('valida os dados do cadastro', async () => {
    const base = { nome: 'Teste', uf: 'BA', latitude: -12, longitude: -40 };
    const invalidos = [
      { ...base, nome: undefined },
      { ...base, nome: '   ' },
      { ...base, uf: 'XX' },
      { ...base, latitude: undefined },
      { ...base, latitude: -91 },
      { ...base, longitude: 181 },
      { ...base, latitude: 'norte' },
      { ...base, idh: 1.2 },
      { ...base, populacao: -5 },
      { ...base, populacao: 10.5 },
      { ...base, codigoIbge: '123' },
      { ...base, indicadores: { C99: 1 } },
      { ...base, indicadores: { C1: -3 } },
      { ...base, indicadores: { C1: 'muito' } },
      { ...base, indicadores: [1, 2, 3] },
      { ...base, anoReferencia: 1500 }
    ];
    for (const corpo of invalidos) {
      const res = await api.post('/api/municipios', corpo, api.admin);
      expect(res.status).toBe(400);
      expect(res.body.mensagem).toEqual(expect.any(String));
    }
    expect((await api.municipioPorNome('Teste'))).toBeUndefined();
  });

  test('latitude e longitude zero são valores válidos', async () => {
    const res = await api.post('/api/municipios', { nome: 'Ponto Zero', uf: 'AP', latitude: 0, longitude: 0 }, api.admin);
    expect(res.status).toBe(201);
    const salvo = (await api.get(`/api/municipios/${res.body.municipioId}`, api.admin)).body.dados;
    expect([salvo.latitude, salvo.longitude]).toEqual([0, 0]);
  });

  test('nome com HTML é armazenado como texto puro (a interface é que o exibe sem interpretar)', async () => {
    const nome = '<img src=x onerror=alert(1)>';
    const res = await api.post('/api/municipios', { nome, uf: 'BA', latitude: -12, longitude: -41 }, api.admin);
    expect(res.status).toBe(201);
    expect((await api.get(`/api/municipios/${res.body.municipioId}`, api.admin)).body.dados.nome).toBe(nome);
    await api.delete(`/api/municipios/${res.body.municipioId}`, api.admin);
  });

  test('atualização parcial altera só os campos enviados', async () => {
    const res = await api.put(`/api/municipios/${ireceId}`, { populacao: 80000, indicadores: { C1: 4.2 } }, api.admin);
    expect(res.status).toBe(200);

    const salvo = (await api.get(`/api/municipios/${ireceId}`, api.admin)).body.dados;
    expect(salvo).toEqual(expect.objectContaining({ nome: 'Irecê', uf: 'BA', populacao: 80000, idh: 0.691, latitude: -11.3094 }));
    expect(salvo.indicadores).toEqual({ ...irece.indicadores, C1: 4.2 });
  });

  test('atualização permite limpar campos opcionais e remover o valor de um indicador', async () => {
    await api.put(`/api/municipios/${ireceId}`, { idh: null, populacao: 0, indicadores: { C7: null } }, api.admin);
    const salvo = (await api.get(`/api/municipios/${ireceId}`, api.admin)).body.dados;
    expect(salvo.idh).toBeNull();
    expect(salvo.populacao).toBe(0);
    expect(salvo.indicadores.C7).toBeUndefined();
    expect(Object.keys(salvo.indicadores)).toHaveLength(6);
  });

  test('um novo ano de referência passa a ser o valor vigente do indicador', async () => {
    await api.put(`/api/municipios/${ireceId}`, { indicadores: { C3: 1500 }, anoReferencia: 2025 }, api.admin);
    const salvo = (await api.get(`/api/municipios/${ireceId}`, api.admin)).body.dados;
    expect(salvo.indicadores.C3).toBe(1500);
    expect(salvo.indicadoresDetalhe.find(i => i.codigo === 'C3').ano_referencia).toBe(2025);
    expect(salvo.indicadoresDetalhe.find(i => i.codigo === 'C1').ano_referencia).toBe(2024);
  });

  test('atualização valida dados, conflitos e existência', async () => {
    expect((await api.put(`/api/municipios/${ireceId}`, { latitude: 200 }, api.admin)).status).toBe(400);
    expect((await api.put(`/api/municipios/${ireceId}`, { nome: '' }, api.admin)).status).toBe(400);
    expect((await api.put(`/api/municipios/${ireceId}`, { nome: 'Salvador' }, api.admin)).status).toBe(409);
    expect((await api.put(`/api/municipios/${ireceId}`, { codigoIbge: '2927408' }, api.admin)).status).toBe(409);
    expect((await api.put('/api/municipios/99999', { populacao: 1 }, api.admin)).status).toBe(404);
    // nada foi alterado pelas tentativas inválidas
    expect((await api.get(`/api/municipios/${ireceId}`, api.admin)).body.dados.nome).toBe('Irecê');
  });

  test('exclusão remove o município, seus indicadores e seus resultados em simulações', async () => {
    const sim = await api.post('/api/topsis/executar', { titulo: 'Antes de excluir' }, api.admin);
    expect(sim.body.ranking.some(r => r.municipioId === ireceId)).toBe(true);
    const totalAntes = sim.body.ranking.length;

    expect((await api.delete(`/api/municipios/${ireceId}`, api.admin)).status).toBe(200);
    expect((await api.get(`/api/municipios/${ireceId}`, api.admin)).status).toBe(404);
    expect((await api.delete(`/api/municipios/${ireceId}`, api.admin)).status).toBe(404);

    const valores = await api.db.get('SELECT COUNT(*) AS total FROM matriz_decisao WHERE municipio_id = ?', [ireceId]);
    expect(valores.total).toBe(0);

    const depois = await api.get(`/api/simulacoes/${sim.body.simulacaoId}`, api.admin);
    expect(depois.body.dados.ranking).toHaveLength(totalAntes - 1);
    expect(depois.body.dados.ranking.some(r => r.municipioId === ireceId)).toBe(false);
  });
});
