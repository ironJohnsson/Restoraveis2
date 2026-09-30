const { describe, it } = require('node:test');
const assert = require('node:assert');
const TopsisService = require('../src/services/topsis.service');

describe('Testes Unitários — Motor TOPSIS (ISO/IEC 25010 & Capítulo 10)', () => {
  it('Deve calcular corretamente a normalização vetorial preservando proporções', () => {
    // Exemplo clássico do roteiro: [3, 4] -> norma = sqrt(9 + 16) = 5 -> [0.6, 0.8]
    const resultado = TopsisService.normalizarColuna([3, 4]);
    assert.strictEqual(Math.abs(resultado[0] - 0.6) < 1e-6, true, 'O primeiro valor deve ser 0.6');
    assert.strictEqual(Math.abs(resultado[1] - 0.8) < 1e-6, true, 'O segundo valor deve ser 0.8');
  });

  it('Deve tratar vetores com valor zero sem gerar NaN ou divisão por zero', () => {
    const resultado = TopsisService.normalizarColuna([0, 0, 0]);
    assert.deepStrictEqual(resultado, [0, 0, 0]);
  });

  it('Deve validar o Benchmark Numérico da Seção 7.3 do Roteiro (B > A > C)', () => {
    // Dados da Tabela 7.3 do Roteiro Metodológico:
    // C1: % domicílios sem eletricidade (Custo)
    // C2: Capacidade solar instalada (Benefício)
    // C3: Renda per capita (Benefício)
    // C4: Tarifa média de energia (Custo)
    // C5: Irradiação solar média (Benefício)
    const criterios = [
      { id: 1, codigo: 'C1', nome: 'Acesso elétrico', tipo: 'custo' },
      { id: 2, codigo: 'C2', nome: 'Capacidade solar', tipo: 'beneficio' },
      { id: 3, codigo: 'C3', nome: 'Renda per capita', tipo: 'beneficio' },
      { id: 4, codigo: 'C4', nome: 'Tarifa média', tipo: 'custo' },
      { id: 5, codigo: 'C5', nome: 'Irradiação solar', tipo: 'beneficio' }
    ];

    const alternativas = [
      { id: 1, nome: 'Município A', uf: 'BA', populacao: 120000, idh: 0.68, latitude: -12.9, longitude: -38.5 },
      { id: 2, nome: 'Município B', uf: 'BA', populacao: 250000, idh: 0.75, latitude: -12.2, longitude: -38.9 },
      { id: 3, nome: 'Município C', uf: 'BA', populacao: 85000,  idh: 0.61, latitude: -9.4,  longitude: -40.5 }
    ];

    // Matriz de dados brutos da seção 7.3:
    // Mun A: 15, 0.8, 980,  0.75, 5.2
    // Mun B: 5,  2.1, 1850, 0.62, 5.8
    // Mun C: 22, 0.3, 650,  0.89, 4.9
    const matriz = [
      [15.0, 0.8, 980.0, 0.75, 5.2],
      [5.0, 2.1, 1850.0, 0.62, 5.8],
      [22.0, 0.3, 650.0, 0.89, 4.9]
    ];

    const pesos = [0.20, 0.20, 0.15, 0.25, 0.20];

    const resultado = TopsisService.executar({ alternativas, criterios, pesos, matriz });

    // Verificação 1: Coeficientes Ci no intervalo [0, 1]
    resultado.ranking.forEach(r => {
      assert.strictEqual(r.ci >= 0 && r.ci <= 1, true, `Ci (${r.ci}) deve estar entre 0 e 1`);
    });

    // Verificação 2: Ordem estrita exigida pelo roteiro: B > A > C
    assert.strictEqual(resultado.ranking[0].nome, 'Município B', '1º colocado deve ser o Município B');
    assert.strictEqual(resultado.ranking[1].nome, 'Município A', '2º colocado deve ser o Município A');
    assert.strictEqual(resultado.ranking[2].nome, 'Município C', '3º colocado deve ser o Município C');

    // Verificação 3: Posições atribuídas corretamente
    assert.strictEqual(resultado.ranking[0].posicao, 1);
    assert.strictEqual(resultado.ranking[1].posicao, 2);
    assert.strictEqual(resultado.ranking[2].posicao, 3);
  });

  it('Deve lançar erro ao receber matriz de decisão com dimensões inconsistentes', () => {
    assert.throws(() => {
      TopsisService.executar({
        alternativas: [{ id: 1, nome: 'Mun 1' }],
        criterios: [{ id: 1, codigo: 'C1', tipo: 'beneficio' }],
        pesos: [1],
        matriz: [] // matriz vazia
      });
    }, /A dimensão da matriz não corresponde à quantidade de alternativas/);
  });

  it('Deve manter a soma proporcional dos pesos igual a 1 quando os pesos de entrada não somarem 1', () => {
    const alternativas = [
      { id: 1, nome: 'Alt 1' },
      { id: 2, nome: 'Alt 2' }
    ];
    const criterios = [
      { id: 1, codigo: 'C1', tipo: 'beneficio' },
      { id: 2, codigo: 'C2', tipo: 'custo' }
    ];
    // Pesos somando 10
    const pesos = [6, 4];
    const matriz = [
      [10, 5],
      [20, 8]
    ];

    const resultado = TopsisService.executar({ alternativas, criterios, pesos, matriz });
    assert.strictEqual(resultado.pesosUtilizados[0], 0.6);
    assert.strictEqual(resultado.pesosUtilizados[1], 0.4);
  });
});
