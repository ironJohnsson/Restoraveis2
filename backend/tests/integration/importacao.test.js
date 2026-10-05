const request = require('supertest');
const { prepararApi } = require('../helpers/api');
const { parseCsv } = require('../../src/services/importacao.service');

const enviarCsv = (api, csv, token, query = '') => request(api.app)
  .post(`/api/importacao/municipios${query}`)
  .set('Authorization', `Bearer ${token}`)
  .set('Content-Type', 'text/csv')
  .send(csv);

function respostaJson(corpo, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => corpo };
}

describe('Importação de dados externos (RF09)', () => {
  const api = prepararApi();
  const fetchOriginal = global.fetch;

  afterEach(() => {
    global.fetch = fetchOriginal;
  });

  describe('parser de CSV', () => {
    test('detecta o separador e trata aspas, aspas escapadas, quebras de linha e BOM', () => {
      expect(parseCsv('﻿a;b;c\r\n1;"x;y";"diz ""oi"""\r\n')).toEqual([['a', 'b', 'c'], ['1', 'x;y', 'diz "oi"']]);
      expect(parseCsv('a,b\n"linha 1\nlinha 2",2')).toEqual([['a', 'b'], ['linha 1\nlinha 2', '2']]);
      expect(parseCsv('a\tb\n1\t2\n\n\n')).toEqual([['a', 'b'], ['1', '2']]);
      expect(parseCsv('')).toEqual([]);
      expect(parseCsv(null)).toEqual([]);
    });
  });

  test('modelo de planilha traz as colunas cadastrais e uma coluna por critério', async () => {
    const res = await api.get('/api/importacao/modelo.csv', api.admin);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/csv/);
    const [cabecalho, exemplo] = res.text.slice(1).trim().split('\n');
    expect(cabecalho).toBe('nome;uf;codigo_ibge;populacao;idh;latitude;longitude;C1;C2;C3;C4;C5;C6;C7');
    expect(exemplo.startsWith('Irecê;BA;2914604;')).toBe(true);
  });

  test('importa CSV: cria municípios novos e atualiza os existentes', async () => {
    const csv = [
      'Município;UF;Código IBGE;População;IDH;Latitude;Longitude;C1;C2;C3;C4;C5;Observação',
      'Irecê;BA;2914604;74507;0,691;-11,3094;-41,839;4,2;2,5;1100;0,74;5,9;novo',
      '"Xique-Xique";ba;;46562;;-10,8229;-42,7245;9,1;1,2;780;0,74;6,0;novo sem código',
      'Salvador;BA;2927408;;;;;1,5;;;;;só atualiza C1'
    ].join('\n');

    const res = await enviarCsv(api, csv, api.admin);
    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({ total: 3, criados: 2, atualizados: 1, erros: [], colunasIgnoradas: ['Observação'] }));

    const irece = await api.municipioPorNome('Irecê');
    expect(irece).toEqual(expect.objectContaining({ uf: 'BA', codigo_ibge: '2914604', populacao: 74507, idh: 0.691, latitude: -11.3094, longitude: -41.839 }));
    expect(irece.indicadores).toEqual({ C1: 4.2, C2: 2.5, C3: 1100, C4: 0.74, C5: 5.9 });

    const xique = await api.municipioPorNome('Xique-Xique');
    expect(xique).toEqual(expect.objectContaining({ uf: 'BA', codigo_ibge: null, idh: null }));

    // células vazias não apagam os dados já cadastrados
    const salvador = await api.municipioPorNome('Salvador');
    expect(salvador).toEqual(expect.objectContaining({ populacao: 2417678, idh: 0.759, latitude: -12.9777 }));
    expect(salvador.indicadores).toEqual({ C1: 1.5, C2: 1.45, C3: 1720, C4: 0.78, C5: 5.4, C6: 12.1, C7: 18 });
  });

  test('os municípios importados entram no cálculo TOPSIS', async () => {
    const res = await api.post('/api/topsis/executar', { criteriosIds: ['C1', 'C2', 'C3', 'C4', 'C5'], salvarSimulacao: false }, api.gestor);
    expect(res.body.ranking).toHaveLength(15);
    expect(res.body.ranking.map(r => r.nome)).toEqual(expect.arrayContaining(['Irecê', 'Xique-Xique']));
  });

  test('linhas inválidas são relatadas com o número da linha e não impedem as demais', async () => {
    const csv = [
      'nome,uf,latitude,longitude,C1',
      'Barra,BA,-11.0894,-43.1417,7.5',
      'Sem Coordenada,BA,,,3',
      'UF Errada,XX,-10,-40,3',
      ',BA,-10,-40,3',
      'Valor Ruim,BA,-10,-40,abc',
      'Latitude Ruim,BA,-95,-40,3'
    ].join('\n');

    const res = await enviarCsv(api, csv, api.admin);
    expect(res.status).toBe(200);
    expect(res.body.criados).toBe(1);
    expect(res.body.atualizados).toBe(0);
    expect(res.body.erros.map(e => e.linha)).toEqual([3, 4, 5, 6, 7]);
    expect(res.body.erros[0].mensagem).toMatch(/latitude/);
    expect(res.body.erros[1].mensagem).toMatch(/UF inválida/);
    expect(res.body.erros[3].mensagem).toMatch(/C1/);

    expect((await api.municipioPorNome('Barra')).indicadores).toEqual({ C1: 7.5 });
    expect(await api.municipioPorNome('Valor Ruim')).toBeUndefined();
  });

  test('código IBGE de um município e nome de outro geram erro na linha', async () => {
    const res = await enviarCsv(api, 'nome;uf;codigo_ibge\nIrecê;BA;2927408', api.admin);
    expect(res.body.erros).toEqual([{ linha: 2, mensagem: expect.stringMatching(/pertence a outro município/) }]);
  });

  test('aceita o CSV em JSON ({ csv }) e o ano de referência na query', async () => {
    const res = await api.post('/api/importacao/municipios?anoReferencia=2025', { csv: 'nome;uf;C1\nBarra;BA;6,5' }, api.admin);
    expect(res.status).toBe(200);
    expect(res.body.atualizados).toBe(1);

    const barra = await api.municipioPorNome('Barra');
    expect(barra.indicadores.C1).toBe(6.5);
    expect(barra.indicadoresDetalhe.find(i => i.codigo === 'C1').ano_referencia).toBe(2025);
  });

  test('rejeita arquivo vazio, só com cabeçalho, sem colunas obrigatórias ou grande demais', async () => {
    expect((await enviarCsv(api, '', api.admin)).status).toBe(400);
    expect((await api.post('/api/importacao/municipios', {}, api.admin)).status).toBe(400);
    expect((await enviarCsv(api, 'nome;uf', api.admin)).status).toBe(400);
    expect((await enviarCsv(api, 'nome;latitude\nX;1', api.admin)).body.mensagem).toMatch(/Coluna obrigatória ausente.*uf/);
    expect((await enviarCsv(api, 'nome;uf\nX;BA', api.admin, '?anoReferencia=abc')).status).toBe(400);

    const enorme = ['nome;uf', ...Array.from({ length: 5001 }, (_, i) => `M${i};BA`)].join('\n');
    expect((await enviarCsv(api, enorme, api.admin)).body.mensagem).toMatch(/limite de 5000 linhas/);
  });

  describe('consultas ao IBGE e ao ViaCEP (serviços externos simulados)', () => {
    const localidade = { id: 2914604, nome: 'Irecê', microrregiao: { mesorregiao: { UF: { sigla: 'BA' } } } };
    const malha = [{ centroide: { longitude: -41.839, latitude: -11.3094 } }];
    const censo = [{ resultados: [{ series: [{ serie: { 2022: '74507' } }] }] }];

    function simularIbge({ malhaOk = true, censoOk = true } = {}) {
      global.fetch = jest.fn(async (url) => {
        if (url.includes('viacep.com.br')) return respostaJson({ localidade: 'Irecê', ibge: '2914604' });
        if (url.includes('/malhas/')) return malhaOk ? respostaJson(malha) : respostaJson({}, 500);
        if (url.includes('/agregados/')) {
          if (!censoOk) throw new Error('timeout');
          return respostaJson(censo);
        }
        if (url.includes('/estados/BA/municipios')) {
          return respostaJson([{ id: 2914604, nome: 'Irecê' }, { id: 2927408, nome: 'Salvador' }, { id: 2914653, nome: 'Itabela' }]);
        }
        return respostaJson(localidade);
      });
    }

    test('dados de um município pelo código IBGE', async () => {
      simularIbge();
      const res = await api.get('/api/importacao/ibge/municipios/2914604', api.admin);
      expect(res.status).toBe(200);
      expect(res.body.dados).toEqual(expect.objectContaining({
        codigoIbge: '2914604', nome: 'Irecê', uf: 'BA', populacao: 74507, latitude: -11.3094, longitude: -41.839
      }));
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });

    test('população e coordenadas indisponíveis voltam como null, sem derrubar a consulta', async () => {
      simularIbge({ malhaOk: false, censoOk: false });
      const res = await api.get('/api/importacao/ibge/municipios/2914604', api.admin);
      expect(res.status).toBe(200);
      expect(res.body.dados).toEqual(expect.objectContaining({ nome: 'Irecê', populacao: null, latitude: null, longitude: null }));
    });

    test('UF obtida pela região imediata quando o município não tem microrregião', async () => {
      global.fetch = jest.fn(async (url) => (url.includes('/localidades/municipios/')
        ? respostaJson({ id: 5101837, nome: 'Boa Esperança do Norte', microrregiao: null, 'regiao-imediata': { 'regiao-intermediaria': { UF: { sigla: 'MT' } } } })
        : respostaJson([])));
      const res = await api.get('/api/importacao/ibge/municipios/5101837', api.admin);
      expect(res.body.dados.uf).toBe('MT');
    });

    test('código malformado responde 400; código inexistente 404 (o IBGE devolve lista vazia)', async () => {
      global.fetch = jest.fn(async () => respostaJson([]));
      expect((await api.get('/api/importacao/ibge/municipios/123', api.admin)).status).toBe(400);
      expect(global.fetch).not.toHaveBeenCalled();
      expect((await api.get('/api/importacao/ibge/municipios/9999999', api.admin)).status).toBe(404);
    });

    test('falha de rede, erro HTTP ou resposta inválida do IBGE respondem 502', async () => {
      global.fetch = jest.fn(async () => { throw new Error('ECONNREFUSED'); });
      expect((await api.get('/api/importacao/ibge/municipios/2914604', api.admin)).status).toBe(502);

      global.fetch = jest.fn(async () => respostaJson({}, 503));
      expect((await api.get('/api/importacao/ibge/municipios/2914604', api.admin)).status).toBe(502);

      global.fetch = jest.fn(async () => ({ ok: true, status: 200, json: async () => { throw new Error('não é JSON'); } }));
      expect((await api.get('/api/importacao/ibge/municipios/2914604', api.admin)).status).toBe(502);
    });

    test('pesquisa municípios por nome dentro de uma UF, ignorando acentos', async () => {
      simularIbge();
      const res = await api.get('/api/importacao/ibge/municipios?uf=ba&nome=irece', api.admin);
      expect(res.status).toBe(200);
      expect(res.body.dados).toEqual([{ codigoIbge: '2914604', nome: 'Irecê', uf: 'BA' }]);

      expect((await api.get('/api/importacao/ibge/municipios?uf=BA&nome=i', api.admin)).status).toBe(400);
      expect((await api.get('/api/importacao/ibge/municipios?nome=irece', api.admin)).status).toBe(400);

      global.fetch = jest.fn(async () => respostaJson({ erro: 'inesperado' }));
      expect((await api.get('/api/importacao/ibge/municipios?uf=BA&nome=irece', api.admin)).status).toBe(502);
    });

    test('localiza o município de um CEP e devolve seus dados do IBGE', async () => {
      simularIbge();
      const res = await api.get('/api/importacao/cep/44900-000', api.admin);
      expect(res.status).toBe(200);
      expect(res.body.dados.nome).toBe('Irecê');
      expect(global.fetch.mock.calls[0][0]).toContain('viacep.com.br/ws/44900000/json/');
    });

    test('CEP malformado responde 400 e CEP inexistente 404', async () => {
      global.fetch = jest.fn(async () => respostaJson({ erro: 'true' }));
      expect((await api.get('/api/importacao/cep/123', api.admin)).status).toBe(400);
      expect((await api.get('/api/importacao/cep/00000000', api.admin)).status).toBe(404);
    });
  });
});
