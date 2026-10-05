const request = require('supertest');
const { prepararApi } = require('../helpers/api');

/**
 * RNF01 — Tempo de resposta do cálculo TOPSIS < 3 s para 500 alternativas.
 * Mede a requisição completa: leitura da matriz no banco, cálculo e gravação do histórico.
 */
describe('Desempenho com 500 alternativas (RNF01)', () => {
  const api = prepararApi();

  beforeAll(async () => {
    const linhas = ['nome;uf;latitude;longitude;C1;C2;C3;C4;C5;C6;C7'];
    for (let i = 1; i <= 500; i++) {
      const valores = [1, 2, 3, 4, 5, 6, 7].map(c => (1 + ((i * 7 + c * 13) % 97)).toString());
      linhas.push([`Carga ${i}`, 'BA', (-12 - (i % 50) / 10).toFixed(2), (-40 - (i % 70) / 10).toFixed(2), ...valores].join(';'));
    }
    const res = await request(api.app)
      .post('/api/importacao/municipios')
      .set('Authorization', `Bearer ${api.admin}`)
      .set('Content-Type', 'text/csv')
      .send(linhas.join('\n'));
    expect(res.body).toEqual(expect.objectContaining({ criados: 500, erros: [] }));
  });

  test('executa e salva o TOPSIS de 513 alternativas x 7 critérios em menos de 3 s', async () => {
    const inicio = Date.now();
    const res = await api.post('/api/topsis/executar', { titulo: 'Carga 500' }, api.gestor);
    const duracao = Date.now() - inicio;

    expect(res.status).toBe(200);
    expect(res.body.totalAlternativas).toBe(513);
    expect(res.body.ranking).toHaveLength(513);
    expect(duracao).toBeLessThan(3000);
    expect(res.body.tempoExecucaoMs).toBeLessThan(3000);

    const salvos = await api.db.get('SELECT COUNT(*) AS total FROM resultados_ranking WHERE simulacao_id = ?', [res.body.simulacaoId]);
    expect(salvos.total).toBe(513);
  });

  test('recupera a simulação salva e gera os relatórios em menos de 3 s cada', async () => {
    const { id } = (await api.get('/api/simulacoes?limite=1', api.gestor)).body.dados[0];

    for (const rota of [`/api/simulacoes/${id}`, `/api/relatorios/${id}/csv`, `/api/relatorios/${id}/pdf`]) {
      const inicio = Date.now();
      const res = await api.get(rota, api.gestor);
      expect(res.status).toBe(200);
      expect(Date.now() - inicio).toBeLessThan(3000);
    }
  });

  test('lista os 513 municípios com indicadores em menos de 3 s', async () => {
    const inicio = Date.now();
    const res = await api.get('/api/municipios', api.gestor);
    expect(res.body.total).toBe(513);
    expect(Object.keys(res.body.dados[0].indicadores)).toHaveLength(7);
    expect(Date.now() - inicio).toBeLessThan(3000);
  });
});
