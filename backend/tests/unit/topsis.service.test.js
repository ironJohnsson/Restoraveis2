const TopsisService = require('../../src/services/topsis.service');

const { normalizar } = TopsisService;
const topsis = (...args) => TopsisService.topsis(...args);

// Exemplo numérico da seção 7.3 do roteiro
const CRITERIOS_73 = [
  { id: 1, codigo: 'C1', nome: '% sem eletricidade', tipo: 'custo' },
  { id: 2, codigo: 'C2', nome: 'Capacidade solar', tipo: 'beneficio' },
  { id: 3, codigo: 'C3', nome: 'Renda per capita', tipo: 'beneficio' },
  { id: 4, codigo: 'C4', nome: 'Tarifa média', tipo: 'custo' },
  { id: 5, codigo: 'C5', nome: 'Irradiação solar', tipo: 'beneficio' }
];
const ALTERNATIVAS_73 = [
  { id: 1, nome: 'Município A', uf: 'BA' },
  { id: 2, nome: 'Município B', uf: 'BA' },
  { id: 3, nome: 'Município C', uf: 'BA' }
];
const MATRIZ_73 = [
  [15, 0.8, 980, 0.75, 5.2],
  [5, 2.1, 1850, 0.62, 5.8],
  [22, 0.3, 650, 0.89, 4.9]
];
const PESOS_73 = [0.20, 0.20, 0.15, 0.25, 0.20];
const TIPOS_73 = CRITERIOS_73.map(c => c.tipo);

describe('TOPSIS Service — testes do roteiro (capítulo 10)', () => {
  test('normalização vetorial preserva proporções', () => {
    const col = [3, 4]; // norma = 5
    const result = normalizar(col);
    expect(result[0]).toBeCloseTo(0.6);
    expect(result[1]).toBeCloseTo(0.8);
  });

  test('Ci deve estar entre 0 e 1', () => {
    const resultado = topsis(MATRIZ_73, PESOS_73, TIPOS_73);
    resultado.forEach((r) => {
      expect(r.ci).toBeGreaterThanOrEqual(0);
      expect(r.ci).toBeLessThanOrEqual(1);
    });
  });

  test('topsis.normalizar() retorna valores entre 0 e 1', () => {
    const { matrizNormalizada } = TopsisService.normalizarMatriz(MATRIZ_73);
    matrizNormalizada.flat().forEach((v) => {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    });
  });

  test('exemplo numérico 7.3: resultado esperado B > A > C', () => {
    const ordem = topsis(MATRIZ_73, PESOS_73, TIPOS_73).map(r => r.indice);
    expect(ordem).toEqual([1, 0, 2]); // B, A, C
  });
});

describe('TOPSIS Service — corretude matemática', () => {
  test('exemplo 7.3 confere com o cálculo manual (planilha)', () => {
    // Valores de referência calculados fora da aplicação
    const resultado = TopsisService.executar({
      alternativas: ALTERNATIVAS_73, criterios: CRITERIOS_73, pesos: PESOS_73, matriz: MATRIZ_73
    });

    expect(resultado.ranking.map(r => r.nome)).toEqual(['Município B', 'Município A', 'Município C']);
    expect(resultado.ranking.map(r => r.posicao)).toEqual([1, 2, 3]);

    const porNome = Object.fromEntries(resultado.ranking.map(r => [r.nome, r]));
    expect(porNome['Município A'].ci).toBeCloseTo(0.336058, 6);
    expect(porNome['Município B'].ci).toBeCloseTo(1, 6);
    expect(porNome['Município C'].ci).toBeCloseTo(0, 6);
    expect(porNome['Município A'].distanciaPositiva).toBeCloseTo(0.151403, 6);
    expect(porNome['Município A'].distanciaNegativa).toBeCloseTo(0.076633, 6);
    expect(porNome['Município C'].distanciaPositiva).toBeCloseTo(0.225185, 6);

    expect(resultado.criteriosInfo.map(c => c.norma)).toEqual([27.0924, 2.2672, 2192.1223, 1.3187, 9.2027]);
    expect(resultado.resumoEstatistico.municipioMenosVulneravel).toBe('Município B');
    expect(resultado.resumoEstatistico.municipioMaisVulneravel).toBe('Município C');
  });

  test('caso sem alternativa dominante (4 alternativas x 3 critérios) confere com o cálculo manual', () => {
    const matriz = [
      [250, 16, 12],
      [200, 16, 8],
      [300, 32, 16],
      [275, 32, 8]
    ];
    const resultado = topsis(matriz, [0.5, 0.3, 0.2], ['custo', 'beneficio', 'beneficio']);
    const ci = [];
    resultado.forEach((r) => { ci[r.indice] = r.ci; });

    expect(ci[0]).toBeCloseTo(0.347039, 6);
    expect(ci[1]).toBeCloseTo(0.450713, 6);
    expect(ci[2]).toBeCloseTo(0.549287, 6);
    expect(ci[3]).toBeCloseTo(0.493513, 6);
    expect(resultado.map(r => r.indice)).toEqual([2, 3, 1, 0]);
  });

  test('critério de custo: menor valor é melhor; benefício: maior valor é melhor', () => {
    const matriz = [[10], [20]];
    expect(topsis(matriz, [1], ['custo'])[0].indice).toBe(0);
    expect(topsis(matriz, [1], ['beneficio'])[0].indice).toBe(1);
  });

  test('A+ e A- seguem o tipo de cada critério', () => {
    const ponderada = [[0.1, 0.4], [0.3, 0.2]];
    const { aPlus, aMinus } = TopsisService.calcularSolucoesIdeais(ponderada, ['beneficio', 'custo']);
    expect(aPlus).toEqual([0.3, 0.2]);
    expect(aMinus).toEqual([0.1, 0.4]);
  });

  test('pesos que não somam 1 são normalizados preservando as proporções', () => {
    const resultado = TopsisService.executar({
      alternativas: [{ id: 1, nome: 'Alt 1' }, { id: 2, nome: 'Alt 2' }],
      criterios: [{ id: 1, codigo: 'C1', tipo: 'beneficio' }, { id: 2, codigo: 'C2', tipo: 'custo' }],
      pesos: [6, 4],
      matriz: [[10, 5], [20, 8]]
    });
    expect(resultado.pesosUtilizados).toEqual([0.6, 0.4]);
  });

  test('multiplicar todos os pesos por uma constante não altera o ranking nem os Ci', () => {
    const base = TopsisService.executar({ alternativas: ALTERNATIVAS_73, criterios: CRITERIOS_73, pesos: PESOS_73, matriz: MATRIZ_73 });
    const escalado = TopsisService.executar({ alternativas: ALTERNATIVAS_73, criterios: CRITERIOS_73, pesos: PESOS_73.map(p => p * 37), matriz: MATRIZ_73 });
    expect(escalado.ranking.map(r => [r.nome, r.ci])).toEqual(base.ranking.map(r => [r.nome, r.ci]));
  });

  test('critério com peso zero não influencia o resultado', () => {
    const criterios = [...CRITERIOS_73, { id: 6, codigo: 'C6', nome: 'Extra', tipo: 'custo' }];
    const comExtra = TopsisService.executar({
      alternativas: ALTERNATIVAS_73,
      criterios,
      pesos: [...PESOS_73, 0],
      matriz: MATRIZ_73.map((linha, i) => [...linha, [1, 999, 50][i]])
    });
    expect(comExtra.ranking.find(r => r.nome === 'Município A').ci).toBeCloseTo(0.336058, 6);
  });

  test('alternativas idênticas recebem Ci 0.5 e desempate estável por nome', () => {
    const resultado = TopsisService.executar({
      alternativas: [{ id: 1, nome: 'Zeta' }, { id: 2, nome: 'Alfa' }],
      criterios: [{ id: 1, codigo: 'C1', tipo: 'beneficio' }],
      pesos: [1],
      matriz: [[7], [7]]
    });
    expect(resultado.ranking.map(r => r.ci)).toEqual([0.5, 0.5]);
    expect(resultado.ranking.map(r => r.nome)).toEqual(['Alfa', 'Zeta']);
  });

  test('classifica a vulnerabilidade pelas faixas de Ci', () => {
    const resultado = TopsisService.executar({ alternativas: ALTERNATIVAS_73, criterios: CRITERIOS_73, pesos: PESOS_73, matriz: MATRIZ_73 });
    const niveis = Object.fromEntries(resultado.ranking.map(r => [r.nome, r.nivelVulnerabilidade]));
    expect(niveis['Município B']).toBe('Baixa Vulnerabilidade');
    expect(niveis['Município A']).toBe('Alta Vulnerabilidade');
    expect(niveis['Município C']).toBe('Alta Vulnerabilidade');
  });
});

describe('TOPSIS Service — robustez das entradas', () => {
  const criterio = [{ id: 1, codigo: 'C1', tipo: 'beneficio' }];
  const alternativa = [{ id: 1, nome: 'Mun 1' }];

  test('coluna toda zerada não gera NaN nem divisão por zero', () => {
    expect(normalizar([0, 0, 0])).toEqual([0, 0, 0]);
    const { matrizNormalizada } = TopsisService.normalizarMatriz([[0, 1], [0, 2]]);
    expect(matrizNormalizada.flat().every(Number.isFinite)).toBe(true);
  });

  test('valor ausente (null) é tratado como zero; texto não numérico é rejeitado', () => {
    expect(TopsisService.normalizarMatriz([[null, 3], [4, 4]]).matrizNormalizada[0][0]).toBe(0);
    expect(() => TopsisService.normalizarMatriz([['abc', 3], [4, 4]])).toThrow(/Valor não numérico/);
  });

  test('rejeita matriz vazia, irregular ou com dimensão diferente das alternativas', () => {
    expect(() => TopsisService.normalizarMatriz([])).toThrow(/inválida ou vazia/);
    expect(() => TopsisService.normalizarMatriz([[1, 2], [3]])).toThrow(/não possui 2 critérios/);
    expect(() => TopsisService.executar({ alternativas: alternativa, criterios: criterio, pesos: [1], matriz: [] }))
      .toThrow(/A dimensão da matriz não corresponde à quantidade de alternativas/);
  });

  test('rejeita ausência de alternativas ou de critérios', () => {
    expect(() => TopsisService.executar({ alternativas: [], criterios: criterio, pesos: [1], matriz: [] })).toThrow(/Nenhuma alternativa/);
    expect(() => TopsisService.executar({ alternativas: alternativa, criterios: [], pesos: [], matriz: [[1]] })).toThrow(/Nenhum critério/);
  });

  test('rejeita pesos em quantidade errada, negativos, não numéricos ou com soma zero', () => {
    const base = { alternativas: alternativa, criterios: criterio, matriz: [[1]] };
    expect(() => TopsisService.executar({ ...base, pesos: [1, 2] })).toThrow(/quantidade de pesos/);
    expect(() => TopsisService.executar({ ...base, pesos: [-1] })).toThrow(/maiores ou iguais a zero/);
    expect(() => TopsisService.executar({ ...base, pesos: ['x'] })).toThrow(/maiores ou iguais a zero/);
    expect(() => TopsisService.executar({ ...base, pesos: [0] })).toThrow(/maior que zero/);
    expect(() => TopsisService.calcularMatrizPonderada([[1, 2]], [1])).toThrow(/difere do número de critérios/);
  });

  test('rejeita tipo de critério desconhecido', () => {
    expect(() => TopsisService.calcularSolucoesIdeais([[0.1]], ['neutro'])).toThrow(/Tipo de critério inválido/);
  });

  test('RNF01: 500 alternativas x 10 critérios calculadas em menos de 3 segundos', () => {
    const criterios = Array.from({ length: 10 }, (_, j) => ({ id: j + 1, codigo: `C${j + 1}`, tipo: j % 2 ? 'custo' : 'beneficio' }));
    const alternativas = Array.from({ length: 500 }, (_, i) => ({ id: i + 1, nome: `Alternativa ${i + 1}` }));
    const matriz = alternativas.map((_, i) => criterios.map((__, j) => 1 + ((i * 31 + j * 17) % 97)));

    const inicio = Date.now();
    const resultado = TopsisService.executar({ alternativas, criterios, pesos: criterios.map(() => 1), matriz });
    expect(Date.now() - inicio).toBeLessThan(3000);
    expect(resultado.ranking).toHaveLength(500);
  });
});
