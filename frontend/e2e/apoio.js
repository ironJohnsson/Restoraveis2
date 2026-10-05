import { expect } from '@playwright/test';

export const CONTAS = {
  admin: { email: 'admin@topsis.gov.br', nome: 'Administrador do Sistema' },
  pesquisador: { email: 'pesquisador@topsis.gov.br', nome: 'Pesquisador Sênior' },
  gestor: { email: 'gestor@topsis.gov.br', nome: 'Gestor de Políticas Públicas' }
};
export const SENHA = '123456';

export async function entrar(page, perfil = 'admin') {
  await page.goto('/');
  await page.getByLabel('E-mail').fill(CONTAS[perfil].email);
  await page.getByLabel('Senha').fill(SENHA);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page.getByTestId('usuario-logado')).toContainText(CONTAS[perfil].nome);
}

export async function abrirAba(page, id) {
  await page.getByTestId(`aba-${id}`).click();
}

/** Nomes dos municípios na tabela de ranking, na ordem exibida. */
export async function nomesDoRanking(page) {
  const linhas = page.getByTestId('linha-ranking');
  await expect(linhas.first()).toBeVisible();
  return linhas.locator('td:nth-child(2) > div:first-child').allTextContents();
}

/** Quantidade de simulações no histórico, consultada direto na API com o token da sessão. */
export async function totalDeSimulacoes(page) {
  return page.evaluate(async () => {
    const token = window.sessionStorage.getItem('topsis.token');
    const res = await fetch('/api/simulacoes', { headers: { Authorization: `Bearer ${token}` } });
    return (await res.json()).total;
  });
}

export async function cadastrarMunicipio(page, { nome, uf = 'BA', latitude, longitude, indicadores = {} }) {
  await abrirAba(page, 'municipios');
  await page.getByTestId('novo-municipio').click();
  const form = page.getByTestId('form-municipio');
  await form.getByLabel('Nome do Município *').fill(nome);
  await form.getByLabel('UF *').fill(uf);
  await form.getByLabel('Latitude *').fill(String(latitude));
  await form.getByLabel('Longitude *').fill(String(longitude));
  for (const [codigo, valor] of Object.entries(indicadores)) {
    await form.locator(`#ind-${codigo}`).fill(String(valor));
  }
  await form.getByRole('button', { name: 'Salvar Município' }).click();
}
