# Manual do Usuário
## Plataforma de Energia Renovável com TOPSIS
**Guia para Gestores Públicos, Pesquisadores e Administradores**

---

## 1. Acesso ao Sistema

Abra a plataforma no navegador (`http://localhost:3000` na instalação padrão) e informe seu e-mail e senha.
Como colocar o sistema no ar está descrito no [README](../../README.md#2-como-executar).

| Perfil | Conta de demonstração | Senha inicial | O que pode fazer |
|---|---|:---:|---|
| **Administrador** | `admin@topsis.gov.br` | `123456` | Tudo: municípios, importação de dados, critérios e usuários |
| **Pesquisador** | `pesquisador@topsis.gov.br` | `123456` | Critérios e pesos, simulações e relatórios |
| **Gestor Público** | `gestor@topsis.gov.br` | `123456` | Consultas, simulações e relatórios |

- **Trocar a senha:** clique no ícone de chave, no topo da tela. A nova senha precisa ter ao menos 8 caracteres. Troque a senha inicial no primeiro acesso.
- **Sair:** ícone de porta, ao lado da chave. A sessão também termina ao fechar a aba ou após 8 horas.
- Botões de cadastro só aparecem para os perfis que podem usá-los.

---

## 2. Painel Principal (Dashboard)

Mostra a **simulação ativa** — a última executada, ou uma prévia com os pesos padrão se ainda não houver nenhuma.

- **Indicadores-chave:** municípios avaliados, média do coeficiente Cᵢ, município menos vulnerável (1º lugar) e o mais vulnerável (prioridade para políticas públicas).
- **Classificação em barras:** municípios em ordem decrescente de Cᵢ.
- **Mapa:** marcadores coloridos pela faixa de vulnerabilidade:
  - 🟢 **Baixa:** Cᵢ ≥ 0,70
  - 🟡 **Média:** 0,40 ≤ Cᵢ < 0,70
  - 🔴 **Alta:** Cᵢ < 0,40
- **Radar comparativo:** compare até 4 municípios nos critérios da simulação (clique nos nomes para marcar ou desmarcar).
- **Tabela do ranking:** com D⁺, D⁻, Cᵢ e diagnóstico. Os botões **CSV** e **PDF** aparecem quando a simulação está salva no histórico.

> **Como ler o Cᵢ.** Quanto mais próximo de 1, mais perto o município está do melhor cenário possível; quanto mais próximo de 0, maior a vulnerabilidade social energética.

---

## 3. Executando uma Simulação TOPSIS

1. Abra a aba **Simulador TOPSIS**.
2. Ajuste o peso de cada critério nos controles deslizantes, ou escolha um cenário pronto:
   - **📌 Pesos Padrão:** os pesos cadastrados na aba Critérios;
   - **⭐ Benchmark Roteiro (7.3):** municípios A, B e C com os pesos do exemplo do roteiro (resultado B > A > C);
   - **☀️ Foco Solar & Renovável**, **🛡️ Foco Social Crítico** e **⚖️ Pesos Iguais**.
3. Confira a **soma dos pesos**. Se não for 100%, o cálculo normaliza os pesos proporcionalmente; o botão **Normalizar para 100%** mostra os valores que serão usados.
4. Marque os municípios que participam (mínimo de 2).
5. Clique em **Executar Cálculo TOPSIS**. O resultado abre no Dashboard e fica gravado no histórico.

Pesquisadores e administradores também veem **Salvar como padrão**, que grava os pesos atuais como padrão da plataforma (a soma precisa ser exatamente 100%).

**Municípios com dados incompletos.** Se faltar o valor de algum critério com peso maior que zero, o município fica fora do cálculo e aparece em um aviso amarelo com os critérios que faltam. Complete os dados na aba Municípios ou zere o peso do critério.

---

## 4. Mapa Georreferenciado

Na aba **Mapa**:
- filtre por faixa de vulnerabilidade (Todos, Alta, Média, Baixa);
- clique em um marcador para ver Cᵢ, classificação, população, IDH e coordenadas;
- alterne para **Mapa de calor** e escolha o indicador: a vulnerabilidade (1 − Cᵢ) ou qualquer critério da simulação. Áreas mais quentes indicam valores mais altos do indicador escolhido.

---

## 5. Municípios (Administrador)

- **Novo Município:** informe nome, UF, latitude e longitude (obrigatórios), além de código IBGE, população, IDH e o valor de cada critério.
  - **Preencher com dados do IBGE:** digite o código IBGE (7 dígitos), um CEP ou parte do nome e clique em **Buscar**. Nome, UF, população (Censo 2022) e coordenadas são preenchidos; confira antes de salvar.
  - Indicadores em branco ficam "sem dado" (aparecem como "—" na tabela).
- **Editar** (ícone de lápis) e **Excluir** (ícone de lixeira) em cada linha. Excluir um município também remove os resultados dele em simulações anteriores.
- **Importar CSV:** para cadastrar ou atualizar muitos municípios de uma vez.
  1. Clique em **Modelo CSV** para baixar a planilha com as colunas esperadas.
  2. Preencha uma linha por município. Colunas: `nome`, `uf` (obrigatórias), `codigo_ibge`, `populacao`, `idh`, `latitude`, `longitude` e uma coluna por critério (`C1`, `C2`...). Use `;` como separador e vírgula decimal (padrão do Excel em português), sem separador de milhar.
  3. Clique em **Importar CSV** e selecione o arquivo.
  4. O resumo informa quantos foram criados e atualizados e, para cada linha recusada, o motivo. Municípios já cadastrados (mesmo código IBGE ou mesmo nome e UF) são atualizados; células vazias não apagam o que já existe.

---

## 6. Critérios (Pesquisador e Administrador)

- A tabela mostra cada critério com **tipo** (↑ Benefício: quanto maior, melhor; ↓ Custo: quanto menor, melhor), unidade, fonte e peso.
- Para alterar nome, tipo, unidade ou fonte, edite a linha e clique no ícone de disquete dela.
- Para alterar os **pesos**, mova os controles e clique em **Salvar pesos**. O botão só habilita quando a soma é 1,0000; **Normalizar** ajusta os valores proporcionalmente.
- **Novo Critério** cria um indicador com peso 0. Depois, informe os valores dele nos municípios e atribua um peso.
- Excluir um critério apaga os valores dele em todos os municípios e redistribui o seu peso entre os demais.

---

## 7. Histórico e Relatórios

Na aba **Histórico & Relatórios**, cada cartão é uma simulação executada, com data, autor, número de municípios e 1º colocado.
- **Carregar no Dashboard:** reabre a simulação como foi executada (com os valores da época).
- **Ícone de planilha (CSV):** ranking com os valores de cada critério, pronto para Excel ou Google Planilhas.
- **Ícone de documento (PDF):** relatório executivo com metadados, critérios e pesos, classificação final e municípios não avaliados.

---

## 8. Usuários (Administrador)

Na aba **Usuários**: cadastre pessoas (nome, e-mail, perfil e senha de ao menos 8 caracteres), altere o perfil, redefina senhas e exclua contas. O sistema não permite excluir a própria conta nem deixar a plataforma sem administrador.

---

## 9. Perguntas Frequentes

- **Por que meu município não aparece no ranking?** Falta o valor de algum critério com peso maior que zero. Veja o aviso amarelo no resultado.
- **Os botões CSV e PDF não aparecem no Dashboard.** A tela está mostrando a prévia inicial, que não é gravada. Execute uma simulação no Simulador.
- **"Sessão expirada" ou volta para a tela de login.** O acesso vale por 8 horas; entre novamente.
- **Os indicadores dos municípios da Bahia são reais?** Não: os valores iniciais são ilustrativos, para demonstração. Importe dados oficiais antes de usar o resultado em decisões.
- **Onde está a documentação técnica da API?** Em `http://localhost:5000/api-docs` (Swagger).
