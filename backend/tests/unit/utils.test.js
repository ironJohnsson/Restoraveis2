const v = require('../../src/utils/validacao');
const HttpError = require('../../src/utils/HttpError');
const { classificar } = require('../../src/utils/classificacao');
const { paraIso } = require('../../src/utils/datas');
const asyncHandler = require('../../src/utils/asyncHandler');

describe('validacao', () => {
  test('numero: converte, aceita vírgula decimal e distingue ausente de vazio', () => {
    expect(v.numero('0,75', 'x')).toBe(0.75);
    expect(v.numero(' 12 ', 'x')).toBe(12);
    expect(v.numero(3.5, 'x')).toBe(3.5);
    expect(v.numero(undefined, 'x')).toBeUndefined();
    expect(v.numero('', 'x')).toBeNull();
    expect(v.numero(null, 'x')).toBeNull();
  });

  test('numero: rejeita valores inválidos com HttpError 400', () => {
    const casos = [
      () => v.numero('abc', 'x'),
      () => v.numero(true, 'x'),
      () => v.numero(Infinity, 'x'),
      () => v.numero(1.5, 'x', { inteiro: true }),
      () => v.numero(-1, 'x', { min: 0 }),
      () => v.numero(2, 'x', { max: 1 }),
      () => v.numero(undefined, 'x', { obrigatorio: true }),
      () => v.numero('', 'x', { obrigatorio: true })
    ];
    casos.forEach((caso) => {
      expect(caso).toThrow(HttpError);
      try { caso(); } catch (err) { expect(err.status).toBe(400); }
    });
  });

  test('texto: apara espaços e valida tamanho, tipo e obrigatoriedade', () => {
    expect(v.texto('  Irecê ', 'nome')).toBe('Irecê');
    expect(v.texto(123, 'nome')).toBe('123');
    expect(v.texto(undefined, 'nome')).toBeUndefined();
    expect(v.texto('  ', 'nome')).toBeNull();
    expect(() => v.texto('abcdef', 'nome', { max: 3 })).toThrow(/no máximo 3/);
    expect(() => v.texto({}, 'nome')).toThrow(/deve ser um texto/);
    expect(() => v.texto(undefined, 'nome', { obrigatorio: true })).toThrow(/obrigatório/);
    expect(() => v.texto('', 'nome', { obrigatorio: true })).toThrow(/obrigatório/);
  });

  test('uf, email, senha, perfil, tipoCriterio, codigoIbge e idParam', () => {
    expect(v.uf('ba')).toBe('BA');
    expect(v.uf(undefined)).toBeUndefined();
    expect(() => v.uf('XX')).toThrow(/UF inválida/);

    expect(v.email('Fulano@Exemplo.COM')).toBe('fulano@exemplo.com');
    expect(v.email(undefined)).toBeUndefined();
    expect(() => v.email('sem-arroba')).toThrow(/E-mail inválido/);

    expect(v.senha('12345678')).toBe('12345678');
    expect(() => v.senha('curta')).toThrow(/mínimo 8/);
    expect(() => v.senha(12345678)).toThrow(/mínimo 8/);
    expect(() => v.senha('x'.repeat(73))).toThrow(/máximo 72/);

    expect(v.perfil('gestor')).toBe('gestor');
    expect(v.perfil(undefined)).toBeUndefined();
    expect(() => v.perfil('root')).toThrow(/Perfil inválido/);

    expect(v.tipoCriterio('CUSTO')).toBe('custo');
    expect(v.tipoCriterio(undefined)).toBeUndefined();
    expect(() => v.tipoCriterio('banana')).toThrow(/'beneficio' ou 'custo'/);

    expect(v.codigoIbge('2927408')).toBe('2927408');
    expect(v.codigoIbge('')).toBeNull();
    expect(() => v.codigoIbge('123')).toThrow(/7 dígitos/);

    expect(v.idParam('15')).toBe(15);
    expect(() => v.idParam('0')).toThrow(/inválido/);
    expect(() => v.idParam('abc')).toThrow(/inválido/);
  });
});

describe('classificacao', () => {
  test('faixas de vulnerabilidade pelos limites 0,40 e 0,70', () => {
    expect(classificar(0.70).nivel).toBe('Baixa Vulnerabilidade');
    expect(classificar(0.6999).nivel).toBe('Média Vulnerabilidade');
    expect(classificar(0.40).nivel).toBe('Média Vulnerabilidade');
    expect(classificar(0.3999).nivel).toBe('Alta Vulnerabilidade');
    expect(classificar(0).cor).toBe('#ef4444');
  });
});

describe('datas', () => {
  test('paraIso interpreta como UTC as datas sem fuso gravadas pelo SQLite', () => {
    expect(paraIso('2026-10-05 15:12:09')).toBe('2026-10-05T15:12:09.000Z');
    expect(paraIso('2026-10-05T15:12:09.000Z')).toBe('2026-10-05T15:12:09.000Z');
    expect(paraIso(new Date('2026-10-05T15:12:09Z'))).toBe('2026-10-05T15:12:09.000Z');
    expect(paraIso(null)).toBeNull();
    expect(paraIso('não é data')).toBe('não é data');
  });
});

describe('asyncHandler', () => {
  test('encaminha a rejeição do handler para next()', async () => {
    const erro = new Error('falhou');
    const next = jest.fn();
    await asyncHandler(async () => { throw erro; })({}, {}, next);
    expect(next).toHaveBeenCalledWith(erro);
  });
});
