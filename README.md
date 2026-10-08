# Plataforma de Energia Renovável com TOPSIS
### Mensuração Multicritério de Vulnerabilidade Social Energética (ODS 7 da ONU)

[![CI](https://github.com/ironJohnsson/Restoraveis2/actions/workflows/ci.yml/badge.svg)](https://github.com/ironJohnsson/Restoraveis2/actions/workflows/ci.yml)
[![ISO/IEC 12207](https://img.shields.io/badge/Norma-ISO%2FIEC%2012207-blue.svg)](docs/qualidade/iso_25010_e_12207.md)
[![ISO/IEC 25010](https://img.shields.io/badge/Qualidade-ISO%2FIEC%2025010-green.svg)](docs/qualidade/iso_25010_e_12207.md)
[![Swagger](https://img.shields.io/badge/API-OpenAPI%203.0%20%2F%20Swagger-orange.svg)](docs/api/README.md)
[![Docker Compose](https://img.shields.io/badge/Deploy-Docker%20Compose-2496ED.svg)](docker-compose.yml)

> **Roteiro elaborado por:** Prof. Me. Celso Barreto com base nas normas ISO/IEC 12207, 15504 e 25010.<br>
> **Equipe composta por:** Juliana Barretto, Matheus Johnsson, Pedro Artur e Victor Barreto<br>
> **Referência:** [Roteiro e Templates do Projeto TOPSIS](https://senaiba.my.canva.site/roteiro1) — transcrição em [docs/referencias/roteiro.txt](docs/referencias/roteiro.txt)

---

## 1. Visão Geral

O acesso à energia renovável é um dos pilares do desenvolvimento sustentável (ODS 7). Esta plataforma mede a
**vulnerabilidade social energética** de municípios/comunidades a partir de vários indicadores (acesso à
eletricidade, capacidade solar, renda, tarifa, irradiação etc.) e os ordena com o método **TOPSIS**
(*Technique for Order Preference by Similarity to Ideal Solution*), para apoiar a priorização de políticas públicas.

| Requisito | O que a plataforma faz |
|---|---|
| RF01 | Cadastro, edição e exclusão de municípios com dados socioeconômicos e indicadores |
| RF02 | Cadastro, edição e exclusão de critérios (tipo benefício/custo, unidade, fonte) |
| RF03 | Configuração dos pesos (soma = 1,0) e cenários de simulação |
| RF04 | Cálculo TOPSIS e ranking, validado contra o exemplo numérico 7.3 do roteiro (B > A > C) |
| RF05 | Dashboard com KPIs, gráfico de barras do ranking e radar comparativo |
| RF06 | Exportação da simulação em PDF e CSV |
| RF07 | Mapa Leaflet com marcadores por faixa de vulnerabilidade e camada de calor por indicador |
| RF08 | Login com JWT, usuários e três perfis de acesso (Administrador, Pesquisador, Gestor Público) |
| RF09 | Importação de CSV e preenchimento automático pelo IBGE (código, nome ou CEP) |
| RF10 | Histórico de simulações, com autor, data, pesos e valores usados |

---

## 2. Como Executar

### Opção A — Docker Compose (1 comando)

Requer Docker com o plugin Compose v2 (comando `docker compose`, com espaço).

```bash
docker compose up -d --build
```

| Serviço | Endereço |
|---|---|
| Interface web | http://localhost:3000 |
| API RESTful | http://localhost:5000 (também em http://localhost:3000/api) |
| Swagger / OpenAPI | http://localhost:5000/api-docs |

Sobem três contêineres: **PostgreSQL + PostGIS**, **backend** (aplica as migrations e os dados iniciais ao
iniciar) e **frontend** (Nginx). Para personalizar senhas e o segredo do JWT, copie `.env.example` para `.env`.
Para parar: `docker compose down` (acrescente `-v` para apagar também os dados).

### Opção B — Modo desenvolvimento (sem Docker)

Requer Node.js 18 ou superior. Neste modo a API usa um banco **SQLite** local, sem nenhuma configuração.

```bash
# Terminal 1 — API em http://localhost:5000
cd backend
npm install
npm start

# Terminal 2 — Interface em http://localhost:3000
cd frontend
npm install
npm run dev
```

Atalhos que fazem os dois passos: `iniciar.bat` ou `iniciar.ps1` (Windows) e `./iniciar.sh` (Linux/macOS).

Para usar PostgreSQL também em desenvolvimento, defina `DATABASE_URL` (veja `backend/.env.example`).

### Contas de demonstração

| Perfil | E-mail | Senha inicial | Pode |
|---|---|:---:|---|
| **Administrador** | `admin@topsis.gov.br` | `123456` | tudo: municípios, importação, critérios, usuários |
| **Pesquisador** | `pesquisador@topsis.gov.br` | `123456` | configurar critérios e pesos, simular, exportar |
| **Gestor Público** | `gestor@topsis.gov.br` | `123456` | consultar, simular e exportar relatórios |

> As contas e a senha existem apenas para demonstração. Em qualquer uso real, troque as senhas no primeiro
> acesso (ícone de chave no topo da tela) ou defina `SEED_SENHA_PADRAO` antes da primeira inicialização.
> Novos usuários são criados pelo Administrador, na aba **Usuários** (senha mínima de 8 caracteres).

---

## 3. Estrutura do Repositório

```
Restoraveis2/
├── frontend/                       # SPA React + Vite + TailwindCSS
│   ├── src/
│   │   ├── components/             # Header, KpiCard, MapaLeaflet, RankingChart, RadarChart, ResultsTable...
│   │   ├── pages/                  # Login, Dashboard, Simulador, Mapa, Municípios, Critérios, Relatórios, Usuários
│   │   ├── services/               # Cliente da API (token JWT, tratamento de erros)
│   │   ├── hooks/                  # useAuth (sessão e perfis), useMensagem
│   │   └── utils/                  # Faixas de vulnerabilidade, formatação, download
│   ├── public/
│   ├── e2e/                        # Testes de sistema (Playwright)
│   ├── nginx.conf, Dockerfile
│   └── package.json
│
├── backend/                        # API RESTful + motor TOPSIS (Node.js + Express)
│   ├── src/
│   │   ├── routes/                 # Rotas e controle de acesso por perfil
│   │   ├── controllers/            # Entrada/saída HTTP
│   │   ├── services/               # Regras de negócio: topsis, simulação, relatórios, importação, IBGE
│   │   ├── models/                 # Acesso a dados (SQL) — um módulo por entidade
│   │   ├── middlewares/            # Autenticação JWT, RBAC, tratamento de erros
│   │   ├── database/               # Adaptadores SQLite/PostgreSQL, migrations runner, seeds
│   │   ├── docs/                   # Especificação OpenAPI 3.0
│   │   ├── config/ e utils/
│   ├── migrations/                 # SQL versionado: sqlite/ e postgres/ (inclui PostGIS)
│   ├── tests/                      # unit/ e integration/ (Jest + Supertest)
│   ├── Dockerfile
│   └── package.json
│
├── docs/
│   ├── requisitos/                 # RF01–RF10, RNF01–RNF06 e matriz de rastreabilidade
│   ├── stakeholders/               # Matriz poder x interesse
│   ├── uml/                        # Casos de uso, classes, sequência, atividades, componentes, implantação
│   ├── arquitetura/                # Camadas, banco de dados, segurança
│   ├── api/                        # Guia da API + openapi.json
│   ├── prototipos/                 # Wireframes das telas principais
│   ├── testes/                     # Plano de testes e checklist de aceitação
│   ├── qualidade/                  # ISO/IEC 25010 e 12207: metas e valores medidos
│   ├── gestao/                     # Plano de sprints (Scrum)
│   ├── revisao/                    # Relatório de revisão: erros encontrados e mudanças
│   ├── manual-usuario/             # Manual do usuário
│   ├── apresentacao/               # Roteiro dos slides e da demonstração
│   └── referencias/                # Transcrição do roteiro
│
├── .github/workflows/ci.yml        # Integração contínua (GitHub Actions)
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## 4. Testes Automatizados

| Nível (cap. 10 do roteiro) | Ferramenta | Onde | Como rodar |
|---|---|---|---|
| Unitário | Jest | `backend/tests/unit` | `cd backend && npm test` |
| Integração (API + banco) | Jest + Supertest | `backend/tests/integration` | `cd backend && npm test` |
| Sistema (E2E no navegador) | Playwright | `frontend/e2e` | `cd frontend && npm run test:e2e` |
| Aceitação | Checklist manual | [docs/testes](docs/testes/plano_de_testes.md) | conferência com planilha |

**Backend:** 214 testes (58 unitários e 156 de integração). Cobertura medida: 98,9% das instruções, 90,8% dos
ramos, 98,3% das funções e 99,5% das linhas. O `npm test` **falha** se qualquer um ficar abaixo de 80% (RNF05).

```bash
cd backend
npm test                 # unitários + integração, com relatório de cobertura (SQLite em memória)

# A mesma suíte contra um PostgreSQL real:
DATABASE_URL=postgres://usuario:senha@localhost:5432/banco_de_teste npx jest --runInBand --coverage=false
```

**E2E:** 18 testes, incluindo o fluxo pedido no roteiro — *usuário cadastra município → executa TOPSIS → vê
ranking* — além de perfis de acesso, relatórios, importação de CSV, mapa e responsividade (375, 820 e 1366 px).

```bash
cd frontend
npx playwright install chromium          # uma vez
npm run test:e2e
# ou, usando o Google Chrome já instalado:  PLAYWRIGHT_CHANNEL=chrome npm run test:e2e
```

> O roteiro cita o Cypress como exemplo de ferramenta E2E; o projeto usa o Playwright, equivalente, por
> rodar com o navegador já instalado na máquina. Os cenários cobertos são os mesmos.

A **integração contínua** ([.github/workflows/ci.yml](.github/workflows/ci.yml)) executa, a cada push: testes do
backend com cobertura, a mesma suíte em PostgreSQL + PostGIS, o build do frontend, os testes E2E e a subida
completa do Docker Compose.

---

## 5. Modelo Multicritério

Critérios da seção 7.1 do roteiro, com os pesos do exemplo numérico 7.3 como padrão:

| Cód | Indicador | Tipo | Unidade | Fonte | Peso padrão |
|:---:|---|:---:|:---:|:---:|:---:|
| **C1** | % domicílios sem acesso à eletricidade | Custo | % | IBGE | 0,20 |
| **C2** | Capacidade instalada solar | Benefício | kW/hab | ANEEL | 0,20 |
| **C3** | Renda per capita | Benefício | R$ | IBGE | 0,15 |
| **C4** | Tarifa média de energia | Custo | R$/kWh | ANEEL | 0,25 |
| **C5** | Índice de irradiação solar | Benefício | kWh/m²/dia | INPE | 0,20 |
| **C6** | % população em extrema pobreza | Custo | % | IBGE | 0,00 |
| **C7** | Nº de projetos de energia renovável ativos | Benefício | unidades | ANEEL | 0,00 |

Critérios e pesos são editáveis na aba **Critérios**. O coeficiente de proximidade `Ci = D⁻ / (D⁺ + D⁻)` varia
de 0 a 1: **quanto maior, menos vulnerável**. Faixas: Baixa (Ci ≥ 0,70), Média (0,40 ≤ Ci < 0,70) e Alta (Ci < 0,40).

**Dados iniciais.** Os municípios A, B e C são os do exemplo 7.3 do roteiro. Os demais são municípios reais da
Bahia (nome, código IBGE e coordenadas), mas **os valores dos indicadores são ilustrativos**, para demonstração.
Para análises reais, substitua-os por dados oficiais usando **Municípios → Importar CSV**.

**Dados ausentes.** Um município sem valor em algum critério com peso maior que zero não entra no cálculo (tratar
o dado ausente como zero o favoreceria nos critérios de custo). A simulação lista esses municípios e os critérios
que faltam.

---

## 6. Documentação

- [Requisitos e rastreabilidade](docs/requisitos/especificacao_requisitos.md) · [Stakeholders](docs/stakeholders/analise_stakeholders.md)
- [Diagramas UML](docs/uml/diagramas_uml_completos.md) · [Arquitetura](docs/arquitetura/visao_arquitetural.md)
- [API (Swagger/OpenAPI)](docs/api/README.md) · [Protótipos de telas](docs/prototipos/README.md)
- [Plano de testes e checklist de aceitação](docs/testes/plano_de_testes.md) · [Qualidade ISO](docs/qualidade/iso_25010_e_12207.md)
- [Relatório de revisão: erros encontrados e mudanças](docs/revisao/relatorio_de_revisao.md)
- [Plano de sprints](docs/gestao/plano_sprints_scrum.md) · [Manual do usuário](docs/manual-usuario/manual_do_usuario.md) · [Roteiro da apresentação](docs/apresentacao/slides_pitch_projeto.md)

---

## 7. Checklist de Entrega do Roteiro

- [x] Repositório Git com histórico de commits
- [x] README.md com instruções de instalação
- [x] Docker Compose (1 comando para subir)
- [x] Documento de Requisitos (RF + RNF)
- [x] Diagramas UML (Casos de Uso, Classes, Sequência, Atividades, Componentes, Implantação)
- [x] Banco de dados modelado e com migrations (SQLite e PostgreSQL + PostGIS)
- [x] API documentada (Swagger)
- [x] TOPSIS implementado com testes de validação
- [x] Frontend responsivo com dashboard
- [x] Testes automatizados (unitários + integração + sistema)
- [x] Manual do Usuário
- [ ] Apresentação: o [roteiro dos slides e da demonstração](docs/apresentacao/slides_pitch_projeto.md) está pronto; o arquivo de slides é montado pela equipe

---

## 8. Licença e Créditos
Projeto acadêmico baseado no roteiro metodológico do **Prof. Me. Celso Barreto**, sob a licença [MIT](LICENSE).
