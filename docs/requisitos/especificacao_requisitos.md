# Especificação de Requisitos de Software (SRS)
## Plataforma de Energia Renovável com Mensuração Multicritério TOPSIS
**Conforme Normas ISO/IEC 12207 e ISO/IEC 25010**
**Projeto:** Plataforma de Vulnerabilidade Social Energética
**Orientação Metodológica:** Prof. Me. Celso Barreto
**Objetivo de Desenvolvimento Sustentável:** ODS 7 — Energia Limpa e Acessível (ONU)

---

## 1. Visão Geral do Produto
A plataforma mensura e espacializa indicadores multicritério de vulnerabilidade social associados ao acesso, uso e potencial de fontes de energia renovável em municípios e comunidades brasileiras, fornecendo subsídios quantitativos para a priorização de políticas públicas através do método de apoio à decisão multicritério **TOPSIS** (*Technique for Order Preference by Similarity to Ideal Solution*).

---

## 2. Requisitos Funcionais (RF)

| ID | Descrição do Requisito | Prioridade | Critério de Aceitação | Situação |
|---|---|:---:|---|:---:|
| **RF01** | Cadastrar municípios/comunidades com dados socioeconômicos | **Alta** | CRUD completo (API e interface), com validação de UF, coordenadas, IDH e população, e bloqueio de duplicidade por nome + UF e por código IBGE. | Implementado |
| **RF02** | Cadastrar indicadores e critérios de vulnerabilidade | **Alta** | Criar, editar e excluir critérios com tipo (benefício/custo), unidade e fonte; valores por município na matriz de decisão. | Implementado |
| **RF03** | Configurar pesos dos critérios TOPSIS | **Alta** | Sliders por critério; os pesos padrão só são gravados se a soma for 1,0 (tolerância 0,001); cenários pré-definidos no simulador. | Implementado |
| **RF04** | Executar cálculo TOPSIS e gerar ranking | **Alta** | Normalização vetorial, matriz ponderada, A⁺/A⁻, distâncias euclidianas e Cᵢ; resultado do exemplo 7.3 do roteiro igual ao cálculo manual (B > A > C). | Implementado |
| **RF05** | Visualizar resultados em dashboard com gráficos | **Média** | Cards de KPI, gráfico de barras do ranking, radar comparativo de até 4 municípios e tabela ranqueada. | Implementado |
| **RF06** | Exportar relatórios em PDF/CSV | **Média** | Download autenticado do relatório da simulação: metadados, critérios e pesos, classificação final e alternativas não avaliadas (PDF); ranking com os valores originais (CSV). | Implementado |
| **RF07** | Visualização georreferenciada (mapa) | **Média** | Mapa Leaflet com marcadores coloridos por faixa de vulnerabilidade, popups e camada de calor por indicador. | Implementado |
| **RF08** | Gerenciar usuários e perfis de acesso | **Alta** | Login com JWT e senha com hash bcrypt; perfis Administrador, Pesquisador e Gestor Público; todas as rotas exigem token e verificam o perfil; cadastro de usuários pelo Administrador. | Implementado |
| **RF09** | Importar dados de fontes externas (IBGE, ANEEL) | **Baixa** | Importação de municípios e indicadores por CSV (planilhas das bases oficiais); preenchimento automático do cadastro pela API do IBGE (código, nome ou CEP via ViaCEP). | Implementado (ver nota) |
| **RF10** | Histórico de simulações TOPSIS | **Baixa** | Cada simulação executada fica registrada com data/hora, usuário, pesos e os valores usados, e pode ser reaberta e exportada. | Implementado |

**Nota sobre o RF09.** A integração automática cobre os dados cadastrais do IBGE (nome, UF, população do Censo 2022 e coordenadas). Os indicadores da ANEEL e do INPE são distribuídos em planilhas e entram pela importação de CSV; não há sincronização automática com essas bases.

---

## 3. Requisitos Não Funcionais (RNF)

| ID | Descrição do Requisito | Categoria (ISO/IEC 25010) | Métrica / Meta | Como é verificado |
|---|---|---|---|---|
| **RNF01** | Tempo de resposta do cálculo TOPSIS | **Eficiência de Desempenho** | < 3 s para 500 alternativas | Teste automatizado com 513 alternativas, medindo a requisição completa (leitura, cálculo e gravação): `desempenho.test.js` |
| **RNF02** | Interface responsiva (desktop, tablet, mobile) | **Usabilidade** | Sem rolagem horizontal em 375, 820 e 1366 px | Testes E2E em três larguras de tela |
| **RNF03** | Disponibilidade ≥ 99,5% | **Confiabilidade** | Uptime mensal | Meta operacional: depende do ambiente de hospedagem. O projeto contribui com healthcheck, reinício automático dos contêineres e tratamento central de erros; não há medição em produção. |
| **RNF04** | Autenticação via JWT com criptografia bcrypt | **Segurança** | 100% das rotas de dados protegidas | Matriz de autorização testada rota a rota: `seguranca.test.js` e `auth.test.js` |
| **RNF05** | Código com cobertura de testes ≥ 80% | **Manutenibilidade** | ≥ 80% (instruções, ramos, funções e linhas) | Limite configurado no Jest: o `npm test` e a integração contínua falham abaixo de 80% |
| **RNF06** | Documentação via Swagger/OpenAPI | **Portabilidade** | 100% das rotas documentadas | `openapi.test.js` compara as rotas do Express com a especificação |

---

## 4. Matriz de Rastreabilidade

| Requisito | Casos de Uso | Modelo de Dados | Implementação principal | Testes Associados |
|---|---|---|---|---|
| RF01 | UC01 | `municipios`, `matriz_decisao` | `municipio.service.js`, `MunicipiosPage.jsx` | `municipios.test.js`; E2E "edita e exclui um município" |
| RF02 | UC02 | `criterios` | `criterios.controller.js`, `CriteriosPage.jsx` | `criterios.test.js`; E2E "cria critério, ajusta os pesos" |
| RF03 | UC02 | `criterios.peso` | `criterios.controller.js`, `TopsisSimulator.jsx` | `criterios.test.js`; `topsis.test.js` |
| RF04 | UC03 | `simulacoes`, `resultados_ranking` | `topsis.service.js`, `simulacao.service.js` | `topsis.service.test.js`; `topsis.test.js`; E2E "exemplo 7.3" |
| RF05 | UC03 | — | `DashboardPage.jsx`, `RankingChart.jsx`, `RadarChart.jsx` | E2E "cadastra município → executa TOPSIS → vê ranking" |
| RF06 | UC04 | — | `relatorio.service.js`, `BotoesRelatorio.jsx` | `relatorios.test.js`; E2E (download de CSV e PDF) |
| RF07 | UC05 | `municipios.latitude/longitude` (+ `coordenadas` PostGIS) | `MapaLeaflet.jsx`, `MapaPage.jsx` | E2E "mapa alterna entre marcadores e camada de calor" |
| RF08 | UC06, UC07 | `usuarios` | `auth.controller.js`, `middlewares/auth.js`, `UsuariosPage.jsx` | `auth.test.js`; `seguranca.test.js`; `usuarios.test.js`; E2E de perfis |
| RF09 | UC08 | `municipios.codigo_ibge` | `importacao.service.js`, `ibge.service.js` | `importacao.test.js`; E2E "importação de CSV" |
| RF10 | UC03, UC04 | `simulacoes.parametros` | `simulacao.service.js`, `RelatoriosPage.jsx` | `topsis.test.js`; E2E "simulação do histórico é recarregada" |
| RNF01 | — | — | `simulacao.model.js` (gravação em lote) | `desempenho.test.js`; `topsis.service.test.js` |
| RNF04 | UC06 | `usuarios.senha_hash` | `routes/index.js`, `middlewares/auth.js` | `seguranca.test.js`; `auth.test.js` |
| RNF06 | — | — | `docs/openapi.js` | `openapi.test.js` |

Os arquivos `*.test.js` ficam em `backend/tests/` e os testes E2E em `frontend/e2e/plataforma.spec.js`.
