const { prepararApi } = require('../helpers/api');
const { textoCsv, numeroCsv, gerarCsv, gerarPdf } = require('../../src/services/relatorio.service');

function binario(res, callback) {
  const partes = [];
  res.on('data', parte => partes.push(parte));
  res.on('end', () => callback(null, Buffer.concat(partes)));
}

describe('Relatórios PDF/CSV (RF06 / UC04)', () => {
  const api = prepararApi();
  let simulacao;

  beforeAll(async () => {
    const ids = await api.idsBenchmark();
    const res = await api.post('/api/topsis/executar', {
      titulo: 'Relatório de teste', municipioIds: ids, criteriosIds: ['C1', 'C2', 'C3', 'C4', 'C5']
    }, api.pesquisador);
    simulacao = res.body;
  });

  test('GET /api/relatorios/:id/csv devolve o ranking completo em CSV', async () => {
    const res = await api.get(`/api/relatorios/${simulacao.simulacaoId}/csv`, api.gestor);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/csv/);
    expect(res.headers['content-disposition']).toContain(`relatorio_topsis_simulacao_${simulacao.simulacaoId}.csv`);
    expect(res.text.charCodeAt(0)).toBe(0xFEFF); // BOM para o Excel

    const linhas = res.text.slice(1).trim().split('\n');
    expect(linhas).toHaveLength(4); // cabeçalho + 3 municípios
    expect(linhas[0]).toMatch(/^Posição;Município;UF;População;IDH;Coeficiente Ci;Distância Positiva \(D\+\);Distância Negativa \(D-\);Classificação;Latitude;Longitude;/);
    expect(linhas[0]).toContain('"C1 - % domicílios sem eletricidade (%)"');

    expect(linhas[1].split(';')).toEqual([
      '1', '"Município B (Benchmark)"', 'BA', '250000', '0,750', '1,000000', '0,000000', '0,225185',
      '"Baixa Vulnerabilidade"', '-12,2568', '-38,9663', '5', '2,1', '1850', '0,62', '5,8'
    ]);
    expect(linhas[2]).toContain('0,336058');
    expect(linhas[3].startsWith('3;"Município C (Benchmark)"')).toBe(true);
  });

  test('GET /api/relatorios/:id/pdf devolve um PDF válido', async () => {
    const res = await api.get(`/api/relatorios/${simulacao.simulacaoId}/pdf`, api.gestor).buffer(true).parse(binario);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toBe('application/pdf');
    expect(res.headers['content-disposition']).toContain('.pdf');
    expect(res.body.subarray(0, 5).toString()).toBe('%PDF-');
    expect(res.body.subarray(-6).toString()).toContain('%%EOF');
    expect(Number(res.headers['content-length'])).toBe(res.body.length);
    expect(res.body.length).toBeGreaterThan(2500);
  });

  test('simulação inexistente responde 404 e id inválido 400, em JSON', async () => {
    for (const formato of ['csv', 'pdf']) {
      const inexistente = await api.get(`/api/relatorios/99999/${formato}`, api.gestor);
      expect(inexistente.status).toBe(404);
      expect(inexistente.body.mensagem).toBe('Simulação não encontrada');
      expect((await api.get(`/api/relatorios/abc/${formato}`, api.gestor)).status).toBe(400);
    }
  });

  test('PDF com muitas alternativas, alternativas excluídas e campos vazios é gerado com paginação', async () => {
    const grande = {
      simulacaoId: 7,
      titulo: 'Simulação extensa com um título bastante longo para testar a quebra de linha no cabeçalho do relatório',
      dataExecucao: '2026-10-05T15:12:09.000Z',
      usuarioNome: null,
      criteriosInfo: simulacao.criteriosInfo,
      resumoEstatistico: { ciMedio: 0.5, municipioMenosVulneravel: 'Município 1', municipioMaisVulneravel: 'Município 120' },
      ranking: Array.from({ length: 120 }, (_, i) => ({
        posicao: i + 1,
        nome: `Município com nome extremamente longo para forçar reticências número ${i + 1}`,
        uf: 'BA',
        populacao: i % 2 ? 1000 * (i + 1) : null,
        idh: i % 3 ? 0.6 : null,
        ci: 1 - i / 120,
        distanciaPositiva: i / 120,
        distanciaNegativa: 1 - i / 120
      })),
      alternativasExcluidas: [{ nome: 'Sem Dados', uf: 'BA', criteriosSemDado: ['C1', 'C4'] }]
    };
    const pdf = await gerarPdf(grande);
    expect(pdf.subarray(0, 5).toString()).toBe('%PDF-');
    expect(pdf.toString('latin1').match(/\/Type \/Page\b/g).length).toBeGreaterThan(2);
  });

  test('PDF e CSV de simulação sem snapshot de critérios (dados antigos) não falham', async () => {
    const antiga = { simulacaoId: 1, titulo: 'Antiga', dataExecucao: null, ranking: [], resumoEstatistico: {} };
    expect((await gerarPdf(antiga)).subarray(0, 5).toString()).toBe('%PDF-');
    expect(gerarCsv({ ...antiga, ranking: [{ posicao: 1, nome: 'X', uf: 'BA', ci: 0.5, distanciaPositiva: 0.1, distanciaNegativa: 0.1 }] }))
      .toContain('1;"X";BA;;;0,500000;0,100000;0,100000;"Média Vulnerabilidade";;');
  });

  test('textos do CSV são escapados e protegidos contra injeção de fórmulas', () => {
    expect(textoCsv('Nome "entre aspas"; com separador')).toBe('"Nome ""entre aspas""; com separador"');
    expect(textoCsv('=HYPERLINK("http://x")')).toBe('"\'=HYPERLINK(""http://x"")"');
    expect(textoCsv('+55')).toBe('"\'+55"');
    expect(textoCsv('-cmd')).toBe('"\'-cmd"');
    expect(textoCsv('@SUM(A1)')).toBe('"\'@SUM(A1)"');
    expect(textoCsv(null)).toBe('""');
  });

  test('números do CSV usam vírgula decimal e ficam vazios quando ausentes', () => {
    expect(numeroCsv(0.336058, 6)).toBe('0,336058');
    expect(numeroCsv(-12.2568)).toBe('-12,2568');
    expect(numeroCsv(1850)).toBe('1850');
    expect(numeroCsv(null)).toBe('');
    expect(numeroCsv(undefined)).toBe('');
    expect(numeroCsv('abc')).toBe('');
  });

  test('município com nome malicioso sai neutralizado no CSV exportado', async () => {
    const criado = await api.post('/api/municipios', {
      nome: '=1+1', uf: 'BA', latitude: -12, longitude: -41,
      indicadores: { C1: 5, C2: 2, C3: 1200, C4: 0.75, C5: 5.5 }
    }, api.admin);
    const sim = await api.post('/api/topsis/executar', { criteriosIds: ['C1', 'C2', 'C3', 'C4', 'C5'] }, api.gestor);

    const csv = (await api.get(`/api/relatorios/${sim.body.simulacaoId}/csv`, api.gestor)).text;
    expect(csv).toContain('"\'=1+1"');
    expect(csv).not.toMatch(/;=1\+1;/);
    await api.delete(`/api/municipios/${criado.body.municipioId}`, api.admin);
  });
});
