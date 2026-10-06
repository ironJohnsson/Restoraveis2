import { test, expect } from '@playwright/test';
import { entrar, abrirAba, nomesDoRanking, totalDeSimulacoes, cadastrarMunicipio } from './apoio.js';

test.describe('Autenticação e perfis de acesso', () => {
  test('exige login e recusa credenciais inválidas', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('button', { name: 'Entrar' })).toBeVisible();
    await expect(page.getByTestId('aba-dashboard')).toHaveCount(0);

    await page.getByLabel('E-mail').fill('admin@topsis.gov.br');
    await page.getByLabel('Senha').fill('senha-errada');
    await page.getByRole('button', { name: 'Entrar' }).click();
    await expect(page.getByTestId('erro-login')).toHaveText('Credenciais inválidas');
  });

  test('a sessão continua após recarregar a página e termina ao sair', async ({ page }) => {
    await entrar(page, 'gestor');
    await page.reload();
    await expect(page.getByTestId('usuario-logado')).toContainText('Gestor Público');

    await page.getByRole('button', { name: 'Sair' }).click();
    await expect(page.getByRole('button', { name: 'Entrar' })).toBeVisible();
    await page.reload();
    await expect(page.getByRole('button', { name: 'Entrar' })).toBeVisible();
  });

  test('gestor consulta, mas não vê ações de cadastro nem a aba de usuários', async ({ page }) => {
    await entrar(page, 'gestor');
    await expect(page.getByTestId('aba-usuarios')).toHaveCount(0);

    await abrirAba(page, 'municipios');
    await expect(page.getByTestId('linha-municipio')).toHaveCount(13);
    await expect(page.getByTestId('novo-municipio')).toHaveCount(0);
    await expect(page.getByRole('button', { name: /^Excluir / })).toHaveCount(0);

    await abrirAba(page, 'criterios');
    await expect(page.getByTestId('novo-criterio')).toHaveCount(0);
    await expect(page.getByTestId('salvar-pesos')).toHaveCount(0);
    await expect(page.getByLabel('Tipo do critério C1')).toBeDisabled();
  });

  test('administrador cadastra um usuário, que consegue entrar com o perfil definido', async ({ page }) => {
    await entrar(page, 'admin');
    await abrirAba(page, 'usuarios');
    await expect(page.getByTestId('tabela-usuarios').locator('tbody tr')).toHaveCount(3);

    await page.getByTestId('novo-usuario').click();
    const form = page.getByTestId('form-usuario');
    await form.getByLabel('Nome *').fill('Carla Mendes');
    await form.getByLabel('E-mail *').fill('carla@topsis.gov.br');
    await form.getByLabel('Perfil de acesso *').selectOption('gestor');
    await form.getByLabel(/Senha \*/).fill('SenhaForte!987');
    await form.getByRole('button', { name: 'Salvar Usuário' }).click();
    await expect(page.getByTestId('mensagem-sucesso')).toContainText('Usuário cadastrado');
    await expect(page.getByTestId('tabela-usuarios')).toContainText('carla@topsis.gov.br');

    await page.getByRole('button', { name: 'Sair' }).click();
    await page.getByLabel('E-mail').fill('carla@topsis.gov.br');
    await page.getByLabel('Senha').fill('SenhaForte!987');
    await page.getByRole('button', { name: 'Entrar' }).click();
    await expect(page.getByTestId('usuario-logado')).toContainText('Carla Mendes');
    await expect(page.getByTestId('usuario-logado')).toContainText('Gestor Público');
  });
});

test.describe('Fluxo principal do roteiro', () => {
  test('usuário cadastra município → executa TOPSIS → vê ranking → exporta relatórios', async ({ page }) => {
    await entrar(page, 'admin');

    // 1. Cadastra o município com seus indicadores
    await cadastrarMunicipio(page, {
      nome: 'Irecê', latitude: -11.3094, longitude: -41.839,
      indicadores: { C1: 4.2, C2: 2.5, C3: 1100, C4: 0.74, C5: 5.9, C6: 16, C7: 9 }
    });
    await expect(page.getByTestId('mensagem-sucesso')).toContainText('Município cadastrado');
    const linha = page.getByTestId('linha-municipio').filter({ hasText: 'Irecê' });
    await expect(linha).toContainText('4.2');
    await expect(linha).toContainText('1100');

    // 2. Executa o TOPSIS com os pesos padrão
    const antes = await totalDeSimulacoes(page);
    await abrirAba(page, 'simulador');
    await expect(page.getByTestId('soma-pesos')).toContainText('100%');
    await page.getByTestId('executar-topsis').click();

    // 3. Vê o ranking no dashboard, com o município recém-cadastrado
    await expect(page.getByTestId('simulacao-ativa')).toContainText('Pesos padrão');
    const nomes = await nomesDoRanking(page);
    expect(nomes).toHaveLength(14);
    expect(nomes).toContain('Irecê');
    await expect(page.getByTestId('kpis')).toContainText('14');
    await expect(page.getByTestId('radar')).toBeVisible();
    await expect(page.getByTestId('mapa').locator('path.leaflet-interactive')).toHaveCount(14);
    expect(await totalDeSimulacoes(page)).toBe(antes + 1);

    // 4. A simulação aparece no histórico com resultados e os relatórios são baixados
    await abrirAba(page, 'relatorios');
    const cartao = page.getByTestId('cartao-simulacao').first();
    await expect(cartao).toContainText('14 municípios');
    await expect(cartao).toContainText('Administrador do Sistema');

    const [csv] = await Promise.all([
      page.waitForEvent('download'),
      cartao.getByRole('button', { name: 'Exportar planilha CSV' }).click()
    ]);
    expect(csv.suggestedFilename()).toMatch(/^relatorio_topsis_simulacao_\d+\.csv$/);
    const fs = await import('node:fs');
    const conteudoCsv = fs.readFileSync(await csv.path(), 'utf8');
    expect(conteudoCsv.trim().split('\n')).toHaveLength(15);
    expect(conteudoCsv).toContain('"Irecê"');

    const [pdf] = await Promise.all([
      page.waitForEvent('download'),
      cartao.getByRole('button', { name: 'Exportar relatório em PDF' }).click()
    ]);
    expect(pdf.suggestedFilename()).toMatch(/\.pdf$/);
    expect(fs.readFileSync(await pdf.path()).subarray(0, 5).toString()).toBe('%PDF-');
  });

  test('cenário do exemplo 7.3 do roteiro produz o ranking B > A > C', async ({ page }) => {
    await entrar(page, 'pesquisador');
    await abrirAba(page, 'simulador');
    await page.getByTestId('cenario-benchmark').click();
    await page.getByTestId('executar-topsis').click();

    expect(await nomesDoRanking(page)).toEqual([
      'Município B (Benchmark)', 'Município A (Benchmark)', 'Município C (Benchmark)'
    ]);
    const cis = await page.getByTestId('linha-ranking').locator('td:nth-child(7)').allTextContents();
    expect(cis.map(c => c.trim())).toEqual(['1.0000', '0.3361', '0.0000']);
  });

  test('simulação do histórico é recarregada no dashboard com ranking e radar', async ({ page }) => {
    await entrar(page, 'gestor');
    await abrirAba(page, 'relatorios');
    const cartao = page.getByTestId('cartao-simulacao').filter({ hasText: 'Benchmark do roteiro' }).first();
    await cartao.getByRole('button', { name: 'Carregar no Dashboard' }).click();

    await expect(page.getByTestId('simulacao-ativa')).toContainText('Benchmark do roteiro');
    expect(await nomesDoRanking(page)).toHaveLength(3);
    await expect(page.getByTestId('radar')).toBeVisible();
    await expect(page.getByTestId('radar').locator('polygon')).toHaveCount(3);
  });

  test('regressão: abrir ou recarregar a plataforma não cria simulações no histórico', async ({ page }) => {
    await entrar(page, 'gestor');
    await expect(page.getByTestId('linha-ranking').first()).toBeVisible();
    const antes = await totalDeSimulacoes(page);

    await page.reload();
    await expect(page.getByTestId('linha-ranking').first()).toBeVisible();
    await page.reload();
    await expect(page.getByTestId('linha-ranking').first()).toBeVisible();

    expect(await totalDeSimulacoes(page)).toBe(antes);
  });
});

test.describe('Cadastros', () => {
  test('administrador edita e exclui um município', async ({ page }) => {
    await entrar(page, 'admin');
    await cadastrarMunicipio(page, { nome: 'Município Temporário', latitude: -12.5, longitude: -41.5, indicadores: { C1: 3 } });
    await expect(page.getByTestId('mensagem-sucesso')).toContainText('Município cadastrado');

    const linha = page.getByTestId('linha-municipio').filter({ hasText: 'Município Temporário' });
    await linha.getByRole('button', { name: 'Editar Município Temporário' }).click();
    const form = page.getByTestId('form-municipio');
    await expect(form.locator('#ind-C1')).toHaveValue('3');
    await form.getByLabel('População').fill('12345');
    await form.locator('#ind-C1').fill('7.5');
    await form.getByRole('button', { name: 'Salvar Município' }).click();
    await expect(page.getByTestId('mensagem-sucesso')).toContainText('Município atualizado');
    await expect(linha).toContainText('12.345');
    await expect(linha).toContainText('7.5');

    page.once('dialog', dialog => dialog.accept());
    await linha.getByRole('button', { name: 'Excluir Município Temporário' }).click();
    await expect(page.getByTestId('mensagem-sucesso')).toContainText('removido');
    await expect(page.getByTestId('linha-municipio').filter({ hasText: 'Município Temporário' })).toHaveCount(0);
  });

  test('cadastro inválido mostra o erro e não cria o município', async ({ page }) => {
    await entrar(page, 'admin');
    await cadastrarMunicipio(page, { nome: 'Salvador', latitude: -12.97, longitude: -38.5 });
    await expect(page.getByTestId('erro-municipio')).toContainText('já está cadastrado');

    await page.getByTestId('form-municipio').getByLabel('Nome do Município *').fill('Latitude Impossível');
    await page.getByTestId('form-municipio').getByLabel('Latitude *').fill('-95');
    await page.getByTestId('form-municipio').getByRole('button', { name: 'Salvar Município' }).click();
    await expect(page.getByTestId('erro-municipio')).toContainText('latitude');
  });

  test('importação de CSV cria municípios e relata as linhas com erro', async ({ page }) => {
    await entrar(page, 'admin');
    await abrirAba(page, 'municipios');
    await page.getByTestId('arquivo-csv').setInputFiles({
      name: 'municipios.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from([
        'nome;uf;latitude;longitude;C1;C2;C3;C4;C5',
        'Xique-Xique;BA;-10,8229;-42,7245;9,1;1,2;780;0,74;6,0',
        'Linha Ruim;XX;-10;-40;1;1;1;1;1'
      ].join('\n'), 'utf8')
    });

    const resultado = page.getByTestId('resultado-importacao');
    await expect(resultado).toContainText('1 criado(s)');
    await expect(resultado).toContainText('Linha 3: UF inválida');
    await expect(page.getByTestId('linha-municipio').filter({ hasText: 'Xique-Xique' })).toContainText('9.1');
  });

  test('pesquisador cria critério, ajusta os pesos (soma = 1) e o exclui', async ({ page }) => {
    await entrar(page, 'pesquisador');
    await abrirAba(page, 'criterios');
    await expect(page.getByTestId('tabela-criterios').locator('tbody tr')).toHaveCount(7);

    await page.getByTestId('novo-criterio').click();
    const form = page.getByTestId('form-criterio');
    await form.getByLabel('Nome do indicador *').fill('Consumo médio residencial');
    await form.getByLabel('Tipo *').selectOption('custo');
    await form.getByLabel('Unidade').fill('kWh/mês');
    await form.getByRole('button', { name: 'Salvar Critério' }).click();
    await expect(page.getByTestId('criterio-C8')).toBeVisible();
    await expect(page.getByLabel('Tipo do critério C8')).toHaveValue('custo');

    // soma diferente de 1 bloqueia o salvamento; ao voltar para 1, salva
    await page.getByTestId('peso-criterio-C1').fill('0.5');
    await expect(page.getByTestId('soma-pesos-criterios')).toHaveText('1.3000');
    await expect(page.getByTestId('salvar-pesos')).toBeDisabled();
    await page.getByTestId('peso-criterio-C1').fill('0.1');
    await page.getByTestId('peso-criterio-C6').fill('0.1');
    await expect(page.getByTestId('soma-pesos-criterios')).toHaveText('1.0000');
    await page.getByTestId('salvar-pesos').click();
    await expect(page.getByTestId('mensagem-sucesso')).toContainText('Pesos atualizados');

    await page.reload();
    await abrirAba(page, 'criterios');
    await expect(page.getByTestId('peso-criterio-C1')).toHaveValue('0.1');
    await expect(page.getByTestId('peso-criterio-C6')).toHaveValue('0.1');

    // altera o tipo de um critério (benefício/custo) e desfaz
    await page.getByLabel('Tipo do critério C8').selectOption('beneficio');
    await page.getByRole('button', { name: 'Salvar critério C8' }).click();
    await expect(page.getByTestId('mensagem-sucesso')).toContainText('Critério C8 atualizado');

    page.once('dialog', dialog => dialog.accept());
    await page.getByRole('button', { name: 'Excluir critério C8' }).click();
    await expect(page.getByTestId('criterio-C8')).toHaveCount(0);

    // restaura os pesos padrão para os próximos testes
    await page.getByTestId('peso-criterio-C1').fill('0.2');
    await page.getByTestId('peso-criterio-C6').fill('0');
    await page.getByTestId('salvar-pesos').click();
    await expect(page.getByTestId('mensagem-sucesso')).toContainText('Pesos atualizados');
  });
});

test.describe('Mapa, segurança da interface e responsividade', () => {
  test('mapa alterna entre marcadores e camada de calor por indicador', async ({ page }) => {
    await entrar(page, 'gestor');
    await abrirAba(page, 'mapa');
    const mapa = page.getByTestId('mapa');
    await expect(mapa.locator('path.leaflet-interactive').first()).toBeVisible();
    await expect(mapa.locator('canvas.leaflet-heatmap-layer')).toHaveCount(0);

    await page.getByTestId('camada-calor').click();
    await expect(mapa.locator('canvas.leaflet-heatmap-layer')).toHaveCount(1);
    await page.getByTestId('indicador-calor').selectOption('C1');
    await expect(mapa.locator('canvas.leaflet-heatmap-layer')).toHaveCount(1);
    await expect(page.getByText('C1 — % domicílios sem eletricidade (%)')).toBeVisible();

    await page.getByTestId('camada-marcadores').click();
    await expect(mapa.locator('canvas.leaflet-heatmap-layer')).toHaveCount(0);
  });

  test('nome de município com HTML é exibido como texto, sem executar script', async ({ page }) => {
    await entrar(page, 'admin');
    const nomeMalicioso = '<img src=x onerror="window.__xss=1">';
    await cadastrarMunicipio(page, {
      nome: nomeMalicioso, latitude: -13.5, longitude: -42.5,
      indicadores: { C1: 2, C2: 9, C3: 3000, C4: 0.5, C5: 7, C6: 1, C7: 50 }
    });
    await expect(page.getByTestId('mensagem-sucesso')).toContainText('Município cadastrado');

    await abrirAba(page, 'simulador');
    await page.getByTestId('executar-topsis').click();
    await expect(page.getByTestId('linha-ranking').first()).toContainText(nomeMalicioso);

    // abre o popup do mapa desse município (1º do ranking) e confere que nada foi interpretado
    await abrirAba(page, 'mapa');
    const mapa = page.getByTestId('mapa');
    await expect(mapa.locator('path.leaflet-interactive').first()).toBeVisible();
    // os marcadores seguem a ordem do ranking: o primeiro é o município recém-criado
    await mapa.locator('path.leaflet-interactive').first().dispatchEvent('click');
    await expect(mapa.locator('.leaflet-popup-content')).toBeVisible();
    await expect(mapa.locator('.leaflet-popup-content')).toContainText(nomeMalicioso);
    await page.waitForTimeout(300);
    expect(await page.evaluate(() => window.__xss)).toBeUndefined();
    expect(await mapa.locator('.leaflet-popup-content img').count()).toBe(0);

    await abrirAba(page, 'municipios');
    page.once('dialog', dialog => dialog.accept());
    await page.getByTestId('linha-municipio').filter({ hasText: nomeMalicioso }).getByRole('button', { name: /^Excluir/ }).click();
    await expect(page.getByTestId('mensagem-sucesso')).toContainText('removido');
  });

  test('município sem dados em critério ponderado fica fora do cálculo, com aviso', async ({ page }) => {
    await entrar(page, 'admin');
    await cadastrarMunicipio(page, { nome: 'Sem Indicadores', latitude: -12.1, longitude: -40.1, indicadores: { C2: 1 } });
    await expect(page.getByTestId('mensagem-sucesso')).toContainText('Município cadastrado');

    await abrirAba(page, 'simulador');
    await page.getByTestId('cenario-padrao').click();
    await page.getByTestId('executar-topsis').click();

    const aviso = page.getByTestId('aviso-excluidas');
    await expect(aviso).toContainText('1 município(s) não entraram no cálculo');
    await expect(aviso).toContainText('Sem Indicadores (BA)');
    await expect(aviso).toContainText('C1');
    expect(await nomesDoRanking(page)).not.toContain('Sem Indicadores');

    await abrirAba(page, 'municipios');
    page.once('dialog', dialog => dialog.accept());
    await page.getByTestId('linha-municipio').filter({ hasText: 'Sem Indicadores' }).getByRole('button', { name: /^Excluir/ }).click();
    await expect(page.getByTestId('mensagem-sucesso')).toContainText('removido');
  });

  for (const [nome, largura, altura] of [['mobile', 375, 740], ['tablet', 820, 1100], ['desktop', 1366, 800]]) {
    test(`interface responsiva sem rolagem horizontal em ${nome} (${largura}px)`, async ({ page }) => {
      await page.setViewportSize({ width: largura, height: altura });
      await entrar(page, 'admin');
      await expect(page.getByTestId('linha-ranking').first()).toBeVisible();

      for (const aba of ['dashboard', 'simulador', 'mapa', 'municipios', 'criterios', 'relatorios', 'usuarios', 'metodologia']) {
        await page.getByTestId(`aba-${aba}`).scrollIntoViewIfNeeded();
        await abrirAba(page, aba);
        const sobra = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
        expect(sobra, `rolagem horizontal na aba ${aba}`).toBeLessThanOrEqual(1);
      }
    });
  }
});
