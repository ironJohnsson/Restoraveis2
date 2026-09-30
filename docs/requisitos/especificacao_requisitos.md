# Especificação de Requisitos de Software (SRS)
## Plataforma de Energia Renovável com Mensuração Multicritério TOPSIS
**Conforme Normas ISO/IEC 12207 e ISO/IEC 25010**  
**Projeto:** Plataforma de Vulnerabilidade Social Energética  
**Orientação Metodológica:** Prof. Me. Celso Barreto  
**Objetivo de Desenvolvimento Sustentável:** ODS 7 — Energia Limpa e Acessível (ONU)

---

## 1. Visão Geral do Produto
A plataforma tem por objetivo mensurar e espacializar indicadores multicritério de vulnerabilidade social associados ao acesso, uso e potencial de fontes de energia renovável em municípios e comunidades brasileiras, fornecendo subsídios quantitativos para a priorização de políticas públicas através do método de apoio à tomada de decisão multicritério **TOPSIS** (*Technique for Order Preference by Similarity to Ideal Solution*).

---

## 2. Requisitos Funcionais (RF)

| ID | Descrição do Requisito | Prioridade | Critério de Aceitação |
|---|---|:---:|---|
| **RF01** | Cadastrar e gerenciar municípios/comunidades com dados socioeconômicos e geográficos (população, IDH, coordenadas latitude/longitude). | **Alta** | Operações CRUD completas persistidas no banco de dados, com validação de duplicidade e formato de coordenadas. |
| **RF02** | Cadastrar e gerenciar indicadores e critérios de vulnerabilidade energética (C1 a C7: acesso elétrico, capacidade solar, renda, tarifas, irradiação, extrema pobreza, projetos ativos). | **Alta** | Suporte a definição de unidade de medida, fonte e tipologia (Benefício ou Custo). |
| **RF03** | Configurar pesos e preferências dos critérios para o algoritmo TOPSIS. | **Alta** | Sliders interativos com validação automática de normalização ($\sum w_j = 1.0$) e sensibilidade personalizável. |
| **RF04** | Executar cálculo TOPSIS matricial e gerar ordenação dos municípios (Ranking de Vulnerabilidade). | **Alta** | Processamento com normalização vetorial, soluções ideais positiva ($A^+$) e negativa ($A^-$), distâncias euclidianas e coeficiente de proximidade relativa ($C_i$). |
| **RF05** | Visualizar resultados e simulações em dashboard analítico com gráficos interativos. | **Média** | Gráficos de barras do ranking, diagramas radar multicritério por alternativa e cartões de indicadores-chave (KPIs). |
| **RF06** | Exportar relatórios analíticos em formatos padronizados (PDF e CSV). | **Média** | Geração e download do relatório completo da simulação com metadados, parâmetros, matriz ponderada e classificação final. |
| **RF07** | Visualização georreferenciada em mapa interativo (GIS). | **Média** | Camada Leaflet interativa com marcadores e gradação cromática por nível de vulnerabilidade energética, popups informativos e coordenadas. |
| **RF08** | Gerenciar usuários, autenticação e controle de perfis de acesso. | **Alta** | Autenticação segura via JSON Web Tokens (JWT) com hash bcrypt, contemplando papéis: Administrador, Pesquisador e Gestor Público. |
| **RF09** | Importar e sincronizar dados de fontes externas abertas (IBGE, ANEEL, INPE). | **Baixa** | Importação via arquivos CSV/JSON e rotinas de ingestão preparadas para expansão com APIs públicas. |
| **RF10** | Histórico e auditoria de simulações TOPSIS executadas. | **Baixa** | Persistência do snapshot de cada simulação com data/hora, usuário responsável, pesos utilizados e resultados obtidos. |

---

## 3. Requisitos Não Funcionais (RNF)

| ID | Descrição do Requisito | Categoria (ISO/IEC 25010) | Métrica / Meta |
|---|---|---|---|
| **RNF01** | Tempo de resposta do processamento do algoritmo TOPSIS. | **Eficiência de Desempenho** | Tempo de execução $< 3,0$ segundos para matrizes de até 500 alternativas. |
| **RNF02** | Interface gráfica com design responsivo e adaptativo. | **Usabilidade** | Compatibilidade fluida com resoluções desktop ($\ge 1280px$), tablet ($768px - 1024px$) e mobile ($< 768px$). |
| **RNF03** | Confiabilidade e disponibilidade contínua do serviço. | **Confiabilidade** | Taxa de disponibilidade $\ge 99,5\%$ em regime de operação. |
| **RNF04** | Mecanismos de segurança da informação e autenticação. | **Segurança** | Autenticação stateless via JWT, hashing de credenciais com bcrypt (salt rounds $\ge 10$) e proteção CORS. |
| **RNF05** | Qualidade do código e manutenibilidade por testes automatizados. | **Manutenibilidade** | Cobertura de testes unitários e de integração $\ge 80\%$, código modularizado em camadas. |
| **RNF06** | Interoperabilidade e documentação das APIs. | **Portabilidade / Compatibilidade** | Especificação OpenAPI 3.0 / Swagger interativa disponível em endpoint dedicado. |

---

## 4. Matriz de Rastreabilidade

| Requisito | Casos de Uso | Modelo de Dados | Testes Associados |
|---|---|---|---|
| RF01 | UC01 (Cadastrar Município) | Tabela `municipios` | `municipios.test.js` |
| RF02 | UC02 (Configurar Critérios) | Tabela `criterios` | `criterios.test.js` |
| RF03 | UC02 (Configurar Critérios) | Tabela `matriz_decisao` | `topsis.test.js` |
| RF04 | UC03 (Executar TOPSIS) | Tabelas `simulacoes`, `resultados_ranking` | `topsis.test.js` |
| RF05 | UC03 (Visualizar Ranking) | Camada de Apresentação (Charts) | Testes E2E / Dashboard |
| RF06 | UC04 (Gerar Relatório) | Endpoints `/api/relatorios/*` | `reports.test.js` |
| RF07 | UC03 / Visualização | Componente `MapaLeaflet` | Validação de coordenadas |
| RF08 | Autenticação | Tabela `usuarios` | `auth.test.js` |
