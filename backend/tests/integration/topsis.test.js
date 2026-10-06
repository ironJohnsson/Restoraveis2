const { prepararApi } = require('../helpers/api');

const CRITERIOS_73 = ['C1', 'C2', 'C3', 'C4', 'C5'];
const PESOS_73 = { C1: 0.2, C2: 0.2, C3: 0.15, C4: 0.25, C5: 0.2 };

describe('Execução do TOPSIS e histórico (RF04 / RF10 / UC03)', () => {
  const api = prepararApi();
  let benchmark;
  let simulacaoBenchmark;

  beforeAll(async () => {
    benchmark = await api.idsBenchmark();
  });

  test('POST /api/topsis/executar retorna 200 com ranking (exemplo 7.3: B > A > C)', async () => {
    const res = await api.post('/api/topsis/executar', {
      titulo: 'Benchmark 7.3', municipioIds: benchmark, criteriosIds: CRITERIOS_73, pesosPersonalizados: PESOS_73
    }, api.pesquisador);

    expect(res.status).toBe(200);
    expect(res.body.sucesso).toBe(true);
    expect(res.body.ranking.map(r => r.nome)).toEqual([
      'Município B (Benchmark)', 'Município A (Benchmark)', 'Município C (Benchmark)'
    ]);
    expect(res.body.ranking.map(r => r.posicao)).toEqual([1, 2, 3]);
    expect(res.body.ranking[1].ci).toBeCloseTo(0.336058, 6);
    expect(res.body.ranking[1].valoresOriginais).toEqual([15, 0.8, 980, 0.75, 5.2]);
    expect(res.body.totalAlternativas).toBe(3);
    expect(res.body.totalCriterios).toBe(5);
    expect(res.body.pesosUtilizados).toEqual([0.2, 0.2, 0.15, 0.25, 0.2]);
    expect(res.body.criteriosInfo.map(c => c.codigo)).toEqual(CRITERIOS_73);
    expect(res.body.resumoEstatistico).toEqual(expect.objectContaining({
      municipioMenosVulneravel: 'Município B (Benchmark)',
      municipioMaisVulneravel: 'Município C (Benchmark)'
    }));
    expect(res.body.alternativasExcluidas).toEqual([]);
    expect(res.body.tempoExecucaoMs).toBeLessThan(3000);
    expect(res.body.tempoCalculoMs).toBeLessThanOrEqual(res.body.tempoExecucaoMs);
    simulacaoBenchmark = res.body;
  });

  test('regressão: a simulação é gravada com id real e os resultados ficam vinculados a ela', async () => {
    expect(Number.isInteger(simulacaoBenchmark.simulacaoId)).toBe(true);
    expect(simulacaoBenchmark.simulacaoId).toBeGreaterThan(0);

    const linhas = await api.db.all('SELECT simulacao_id, municipio_id, posicao FROM resultados_ranking ORDER BY posicao');
    expect(linhas).toHaveLength(3);
    linhas.forEach(l => expect(l.simulacao_id).toBe(simulacaoBenchmark.simulacaoId));
    expect(linhas.map(l => l.municipio_id)).toEqual([benchmark[1], benchmark[0], benchmark[2]]);
  });

  test('GET /api/simulacoes/:id devolve a simulação salva no mesmo formato da execução', async () => {
    const res = await api.get(`/api/simulacoes/${simulacaoBenchmark.simulacaoId}`, api.gestor);
    expect(res.status).toBe(200);

    const salva = res.body.dados;
    expect(salva.simulacaoId).toBe(simulacaoBenchmark.simulacaoId);
    expect(salva.titulo).toBe('Benchmark 7.3');
    expect(salva.usuarioNome).toBe('Pesquisador Sênior');
    expect(salva.dataExecucao).toBe(simulacaoBenchmark.dataExecucao);
    expect(salva.criteriosInfo).toEqual(simulacaoBenchmark.criteriosInfo);
    expect(salva.pesosUtilizados).toEqual(simulacaoBenchmark.pesosUtilizados);
    expect(salva.resumoEstatistico).toEqual(simulacaoBenchmark.resumoEstatistico);

    const campos = ['municipioId', 'nome', 'uf', 'posicao', 'ci', 'distanciaPositiva', 'distanciaNegativa',
      'nivelVulnerabilidade', 'corVulnerabilidade', 'valoresOriginais', 'latitude', 'longitude'];
    salva.ranking.forEach((item, i) => {
      campos.forEach(campo => expect(item[campo]).toEqual(simulacaoBenchmark.ranking[i][campo]));
    });
  });

  test('a data de execução é gravada em UTC no formato ISO 8601', async () => {
    const agora = Date.now();
    const data = new Date(simulacaoBenchmark.dataExecucao);
    expect(simulacaoBenchmark.dataExecucao).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    expect(Math.abs(agora - data.getTime())).toBeLessThan(60 * 1000);
  });

  test('sem parâmetros usa todos os municípios, todos os critérios e os pesos padrão', async () => {
    const res = await api.post('/api/topsis/executar', {}, api.gestor);
    expect(res.status).toBe(200);
    expect(res.body.titulo).toBe('Simulação TOPSIS de Vulnerabilidade Energética');
    expect(res.body.ranking).toHaveLength(13);
    expect(res.body.totalCriterios).toBe(7);
    expect(res.body.pesosUtilizados).toEqual([0.2, 0.2, 0.15, 0.25, 0.2, 0, 0]);
    expect(res.body.ranking.map(r => r.posicao)).toEqual(Array.from({ length: 13 }, (_, i) => i + 1));

    const cis = res.body.ranking.map(r => r.ci);
    expect(cis).toEqual([...cis].sort((a, b) => b - a));
    cis.forEach((ci) => {
      expect(ci).toBeGreaterThanOrEqual(0);
      expect(ci).toBeLessThanOrEqual(1);
    });
    expect(res.body.usuarioNome).toBe('Gestor de Políticas Públicas');
  });

  test('salvarSimulacao=false calcula sem gravar no histórico', async () => {
    const antes = (await api.get('/api/simulacoes', api.gestor)).body.total;
    const res = await api.post('/api/topsis/executar', { salvarSimulacao: false }, api.gestor);
    expect(res.status).toBe(200);
    expect(res.body.simulacaoId).toBeNull();
    expect(res.body.ranking).toHaveLength(13);
    expect((await api.get('/api/simulacoes', api.gestor)).body.total).toBe(antes);
  });

  test('pesos personalizados são normalizados e podem ser informados por id do critério', async () => {
    const criterios = (await api.get('/api/criterios', api.gestor)).body.dados;
    const c1 = criterios.find(c => c.codigo === 'C1');
    const c2 = criterios.find(c => c.codigo === 'C2');

    const res = await api.post('/api/topsis/executar', {
      criteriosIds: [c1.id, 'c2'], pesosPersonalizados: { [c1.id]: 3, C2: 1 }, salvarSimulacao: false
    }, api.gestor);
    expect(res.status).toBe(200);
    expect(res.body.criteriosInfo.map(c => c.id)).toEqual([c1.id, c2.id]);
    expect(res.body.pesosUtilizados).toEqual([0.75, 0.25]);
  });

  test('município sem dado em critério ponderado é excluído do cálculo, não tratado como zero', async () => {
    const criado = await api.post('/api/municipios', {
      nome: 'Sem Dados de Custo', uf: 'BA', latitude: -12, longitude: -40, indicadores: { C2: 1.0, C3: 900, C5: 5.0 }
    }, api.admin);

    const res = await api.post('/api/topsis/executar', { criteriosIds: CRITERIOS_73, salvarSimulacao: false }, api.gestor);
    expect(res.status).toBe(200);
    expect(res.body.ranking).toHaveLength(13);
    expect(res.body.ranking.some(r => r.municipioId === criado.body.municipioId)).toBe(false);
    expect(res.body.alternativasExcluidas).toEqual([{
      municipioId: criado.body.municipioId, nome: 'Sem Dados de Custo', uf: 'BA', criteriosSemDado: ['C1', 'C4']
    }]);

    // se os critérios sem dado tiverem peso zero, o município participa normalmente
    const semCustos = await api.post('/api/topsis/executar', {
      criteriosIds: CRITERIOS_73, pesosPersonalizados: { C1: 0, C4: 0 }, salvarSimulacao: false
    }, api.gestor);
    expect(semCustos.body.ranking).toHaveLength(14);
    expect(semCustos.body.alternativasExcluidas).toEqual([]);
    expect(semCustos.body.ranking.find(r => r.municipioId === criado.body.municipioId).valoresOriginais)
      .toEqual([null, 1, 900, null, 5]);

    await api.delete(`/api/municipios/${criado.body.municipioId}`, api.admin);
  });

  test('exige ao menos 2 alternativas com dados completos', async () => {
    const res = await api.post('/api/topsis/executar', { municipioIds: [benchmark[0]] }, api.gestor);
    expect(res.status).toBe(400);
    expect(res.body.mensagem).toMatch(/ao menos 2 alternativas/);
  });

  test('rejeita parâmetros inválidos com 400 e mensagem clara', async () => {
    const casos = [
      [{ pesosPersonalizados: { C1: -1 } }, /Peso inválido/],
      [{ pesosPersonalizados: { C1: 'abc' } }, /Peso inválido/],
      [{ pesosPersonalizados: { C1: 0, C2: 0, C3: 0, C4: 0, C5: 0, C6: 0, C7: 0 } }, /soma dos pesos/],
      [{ pesosPersonalizados: [0.5, 0.5] }, /pesosPersonalizados/],
      [{ criteriosIds: ['C99'] }, /Critério\(s\) inexistente/],
      [{ criteriosIds: 'C1' }, /criteriosIds/],
      [{ municipioIds: [99999] }, /Município\(s\) inexistente/],
      [{ municipioIds: 'todos' }, /municipioIds/]
    ];
    for (const [corpo, mensagem] of casos) {
      const res = await api.post('/api/topsis/executar', corpo, api.gestor);
      expect(res.status).toBe(400);
      expect(res.body.mensagem).toMatch(mensagem);
    }
  });

  test('histórico lista as simulações da mais recente para a mais antiga, com autor e 1º colocado', async () => {
    const res = await api.get('/api/simulacoes', api.gestor);
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(2);

    const ids = res.body.dados.map(s => s.id);
    expect(ids).toEqual([...ids].sort((a, b) => b - a));

    const bench = res.body.dados.find(s => s.id === simulacaoBenchmark.simulacaoId);
    expect(bench).toEqual(expect.objectContaining({
      titulo: 'Benchmark 7.3',
      status: 'concluida',
      usuario_nome: 'Pesquisador Sênior',
      total_municipios: 3,
      melhor_classificado: 'Município B (Benchmark)'
    }));
    expect(bench.data_execucao).toBe(simulacaoBenchmark.dataExecucao);
    expect(bench.parametros.pesosUtilizados).toEqual([0.2, 0.2, 0.15, 0.25, 0.2]);
    expect(bench.parametros.valores).toBeUndefined();
  });

  test('parâmetro limite restringe o histórico; valores inválidos respondem 400', async () => {
    const res = await api.get('/api/simulacoes?limite=1', api.gestor);
    expect(res.body.dados).toHaveLength(1);
    expect((await api.get('/api/simulacoes?limite=0', api.gestor)).status).toBe(400);
  });

  test('os caminhos antigos /api/topsis/simulacoes continuam funcionando', async () => {
    const lista = await api.get('/api/topsis/simulacoes', api.gestor);
    expect(lista.status).toBe(200);
    expect(lista.body.total).toBe(2);

    const uma = await api.get(`/api/topsis/simulacoes/${simulacaoBenchmark.simulacaoId}`, api.gestor);
    expect(uma.body.dados.ranking).toHaveLength(3);
  });

  test('simulação inexistente responde 404 e id inválido 400', async () => {
    expect((await api.get('/api/simulacoes/99999', api.gestor)).status).toBe(404);
    expect((await api.get('/api/simulacoes/abc', api.gestor)).status).toBe(400);
  });

  test('alterar os dados de um município não muda os valores registrados em simulações antigas', async () => {
    await api.put(`/api/municipios/${benchmark[0]}`, { indicadores: { C1: 99 } }, api.admin);
    const res = await api.get(`/api/simulacoes/${simulacaoBenchmark.simulacaoId}`, api.gestor);
    const municipioA = res.body.dados.ranking.find(r => r.municipioId === benchmark[0]);
    expect(municipioA.valoresOriginais[0]).toBe(15);
    expect(municipioA.ci).toBeCloseTo(0.336058, 6);
    await api.put(`/api/municipios/${benchmark[0]}`, { indicadores: { C1: 15 } }, api.admin);
  });
});
