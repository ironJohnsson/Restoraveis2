const { prepararApi } = require('../helpers/api');

const PESOS_PADRAO = { C1: 0.2, C2: 0.2, C3: 0.15, C4: 0.25, C5: 0.2, C6: 0, C7: 0 };

describe('Critérios e pesos (RF02 / RF03 / UC02)', () => {
  const api = prepararApi();
  let c8;

  const pesosAtuais = async () => {
    const res = await api.get('/api/criterios', api.gestor);
    return Object.fromEntries(res.body.dados.map(c => [c.codigo, c.peso]));
  };

  test('lista os 7 critérios da seção 7.1 com tipo, fonte e pesos somando 1', async () => {
    const res = await api.get('/api/criterios', api.gestor);
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(7);
    expect(res.body.somaPesos).toBe(1);
    expect(res.body.dados.map(c => [c.codigo, c.tipo, c.fonte])).toEqual([
      ['C1', 'custo', 'IBGE'],
      ['C2', 'beneficio', 'ANEEL'],
      ['C3', 'beneficio', 'IBGE'],
      ['C4', 'custo', 'ANEEL'],
      ['C5', 'beneficio', 'INPE'],
      ['C6', 'custo', 'IBGE'],
      ['C7', 'beneficio', 'ANEEL']
    ]);
    expect(await pesosAtuais()).toEqual(PESOS_PADRAO);
  });

  test('pesquisador cadastra critério: código gerado (C8) e peso inicial 0', async () => {
    const res = await api.post('/api/criterios', {
      nome: 'Consumo médio residencial', tipo: 'Custo', unidade: 'kWh/mês', fonte: 'EPE', descricao: 'Consumo médio por domicílio'
    }, api.pesquisador);
    expect(res.status).toBe(201);
    expect(res.body.codigo).toBe('C8');
    c8 = res.body.criterioId;
    expect(c8).toBeGreaterThan(7);

    const lista = await api.get('/api/criterios', api.gestor);
    expect(lista.body.dados.find(c => c.id === c8)).toEqual(expect.objectContaining({
      codigo: 'C8', nome: 'Consumo médio residencial', tipo: 'custo', peso: 0, unidade: 'kWh/mês', fonte: 'EPE'
    }));
    expect(lista.body.somaPesos).toBe(1);
  });

  test('aceita código informado e rejeita código repetido ou malformado', async () => {
    const ok = await api.post('/api/criterios', { codigo: 'eolica', nome: 'Potencial eólico', tipo: 'beneficio' }, api.admin);
    expect(ok.status).toBe(201);
    expect(ok.body.codigo).toBe('EOLICA');

    expect((await api.post('/api/criterios', { codigo: 'c1', nome: 'Repetido', tipo: 'custo' }, api.admin)).status).toBe(409);
    expect((await api.post('/api/criterios', { codigo: '1 x', nome: 'Ruim', tipo: 'custo' }, api.admin)).status).toBe(400);
  });

  test('valida nome e tipo no cadastro', async () => {
    expect((await api.post('/api/criterios', { tipo: 'custo' }, api.admin)).status).toBe(400);
    expect((await api.post('/api/criterios', { nome: 'Sem tipo' }, api.admin)).status).toBe(400);
    expect((await api.post('/api/criterios', { nome: 'Tipo ruim', tipo: 'banana' }, api.admin)).status).toBe(400);
  });

  test('atualiza tipo, unidade e fonte; tipo inválido responde 400 (não 500)', async () => {
    const res = await api.put(`/api/criterios/${c8}`, { tipo: 'beneficio', unidade: 'kWh', fonte: 'ANEEL' }, api.pesquisador);
    expect(res.status).toBe(200);
    const salvo = (await api.get('/api/criterios', api.gestor)).body.dados.find(c => c.id === c8);
    expect(salvo).toEqual(expect.objectContaining({ tipo: 'beneficio', unidade: 'kWh', fonte: 'ANEEL', nome: 'Consumo médio residencial' }));

    const invalido = await api.put(`/api/criterios/${c8}`, { tipo: 'banana' }, api.pesquisador);
    expect(invalido.status).toBe(400);
    expect((await api.put('/api/criterios/99999', { nome: 'X' }, api.pesquisador)).status).toBe(404);
  });

  test('peso não é alterado por PUT /criterios/:id', async () => {
    const res = await api.put(`/api/criterios/${c8}`, { peso: 0.5 }, api.pesquisador);
    expect(res.status).toBe(400);
    expect((await pesosAtuais()).C8).toBe(0);
  });

  test('atualiza os pesos quando a soma de todos os critérios é 1', async () => {
    const novos = { C1: 0.3, C2: 0.1, C3: 0.1, C4: 0.2, C5: 0.1, C6: 0.1, C7: 0.05, C8: 0.05 };
    const res = await api.put('/api/criterios/pesos', { pesos: novos }, api.pesquisador);
    expect(res.status).toBe(200);
    expect(res.body.dados).toHaveLength(9);
    expect(await pesosAtuais()).toEqual({ ...novos, EOLICA: 0 });
  });

  test('aceita a lista [{ id, peso }] e atualização parcial que mantém a soma em 1', async () => {
    const criterios = (await api.get('/api/criterios', api.gestor)).body.dados;
    const c1 = criterios.find(c => c.codigo === 'C1');
    const c2 = criterios.find(c => c.codigo === 'C2');

    const res = await api.put('/api/criterios/pesos', { pesos: [{ id: c1.id, peso: 0.2 }, { id: c2.id, peso: '0,2' }] }, api.admin);
    expect(res.status).toBe(200);
    const pesos = await pesosAtuais();
    expect([pesos.C1, pesos.C2]).toEqual([0.2, 0.2]);
  });

  test('rejeita pesos inválidos sem gravar nada', async () => {
    const antes = await pesosAtuais();
    const invalidos = [
      { C1: 5, C2: -3 },
      { C1: 0.9 },
      { C1: 1.5 },
      { C1: -0.1 },
      { C1: 'abc' },
      { C99: 0.1 },
      {}
    ];
    for (const pesos of invalidos) {
      const res = await api.put('/api/criterios/pesos', { pesos }, api.pesquisador);
      expect(res.status).toBe(400);
    }
    expect((await api.put('/api/criterios/pesos', {}, api.pesquisador)).status).toBe(400);
    expect((await api.put('/api/criterios/pesos', { pesos: 'x' }, api.pesquisador)).status).toBe(400);
    expect(await pesosAtuais()).toEqual(antes);
  });

  test('excluir um critério remove seus valores e redistribui o peso entre os demais', async () => {
    const criterios = (await api.get('/api/criterios', api.gestor)).body.dados;
    const c1 = criterios.find(c => c.codigo === 'C1');

    const res = await api.delete(`/api/criterios/${c1.id}`, api.pesquisador);
    expect(res.status).toBe(200);

    const depois = await api.get('/api/criterios', api.gestor);
    expect(depois.body.dados.some(c => c.codigo === 'C1')).toBe(false);
    expect(depois.body.somaPesos).toBeCloseTo(1, 3);
    // C1 tinha 0,2; os demais crescem na proporção 1 / 0,8
    expect(depois.body.dados.find(c => c.codigo === 'C4').peso).toBeCloseTo(0.25, 4);

    const valores = await api.db.get('SELECT COUNT(*) AS total FROM matriz_decisao WHERE criterio_id = ?', [c1.id]);
    expect(valores.total).toBe(0);
    const salvador = await api.municipioPorNome('Salvador');
    expect(salvador.indicadores.C1).toBeUndefined();
    expect(salvador.indicadores.C2).toBe(1.45);

    expect((await api.delete(`/api/criterios/${c1.id}`, api.pesquisador)).status).toBe(404);
  });

  test('critério ponderado sem nenhum dado impede o cálculo, com explicação do motivo', async () => {
    // C8 foi criado sem valores na matriz e está com peso maior que zero
    const res = await api.post('/api/topsis/executar', { salvarSimulacao: false }, api.gestor);
    expect(res.status).toBe(400);
    expect(res.body.mensagem).toMatch(/ao menos 2 alternativas com dados completos/);
    expect(res.body.detalhes.alternativasExcluidas).toHaveLength(13);
    expect(res.body.detalhes.alternativasExcluidas[0].criteriosSemDado).toEqual(['C8']);
  });

  test('o TOPSIS continua executando após a exclusão de um critério', async () => {
    const res = await api.post('/api/topsis/executar', { pesosPersonalizados: { C8: 0 }, salvarSimulacao: false }, api.gestor);
    expect(res.status).toBe(200);
    expect(res.body.criteriosInfo.some(c => c.codigo === 'C1')).toBe(false);
    expect(res.body.ranking).toHaveLength(13);
  });

  test('não permite excluir o último critério; ao sobrar um, ele fica com peso 1', async () => {
    let criterios = (await api.get('/api/criterios', api.gestor)).body.dados;
    while (criterios.length > 1) {
      expect((await api.delete(`/api/criterios/${criterios[0].id}`, api.admin)).status).toBe(200);
      criterios = (await api.get('/api/criterios', api.gestor)).body.dados;
    }
    expect(criterios[0].peso).toBe(1);
    expect((await api.delete(`/api/criterios/${criterios[0].id}`, api.admin)).status).toBe(409);
  });
});
