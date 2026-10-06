# Visão da Arquitetura do Sistema
## Plataforma de Energia Renovável com TOPSIS
**Conforme Capítulos 5 e 6 do Roteiro Metodológico**

---

## 1. Padrão Arquitetural em Camadas

O sistema adota o padrão em camadas (MVC expandido), com separação entre apresentação, lógica de negócio e persistência:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Camada de Apresentação                          │
│   React 18 + Vite + TailwindCSS + Leaflet (mapas e camada de calor)    │
│   pages/ → components/ → hooks/ (sessão) → services/api.js             │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ REST / JSON + token JWT (Bearer)
┌───────────────────────────────────▼────────────────────────────────────┐
│                      Camada de Aplicação (API)                         │
│   routes/ (rotas e perfis) → middlewares/ (JWT, RBAC, erros)           │
│   → controllers/ (entrada e saída HTTP)                                │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│                         Camada de Domínio                              │
│   services/: topsis (motor matemático), simulacao, municipio,          │
│   relatorio (PDF/CSV), importacao (CSV), ibge (APIs externas)          │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│                    Camada de Infraestrutura e Dados                    │
│   models/ (repositórios SQL por entidade) → database/ (adaptadores     │
│   SQLite e PostgreSQL, migrations versionadas, seeds)                  │
└────────────────────────────────────────────────────────────────────────┘
```

### Responsabilidades

1. **Apresentação (frontend).** SPA em React. Os gráficos (barras do ranking e radar) são componentes SVG/HTML próprios, sem biblioteca de gráficos; o mapa usa Leaflet e o plugin `leaflet.heat`. O frontend acessa a API pelo mesmo domínio (proxy do Vite em desenvolvimento e do Nginx em produção).
2. **Aplicação (API).** As rotas declaram quais perfis podem executar cada operação; os controllers apenas validam a entrada, chamam o serviço e montam a resposta.
3. **Domínio (serviços).** `TopsisService` é puro (sem banco nem HTTP), o que permite testá-lo isoladamente. `simulacao.service` monta a matriz de decisão, trata dados ausentes, executa o TOPSIS e persiste o resultado.
4. **Infraestrutura.** Os models concentram todo o SQL. O projeto não usa ORM: o SQL é escrito no subconjunto comum a SQLite e PostgreSQL (com `INSERT ... RETURNING` e `ON CONFLICT`), e dois adaptadores pequenos cuidam das diferenças de conexão e de transação.

---

## 2. Banco de Dados

| Ambiente | Banco | Quando é usado |
|---|---|---|
| Docker Compose | **PostgreSQL 16 + PostGIS** | sempre que a variável `DATABASE_URL` está definida |
| Desenvolvimento e testes | **SQLite** (sql.js, arquivo `backend/data/database.sqlite` ou memória) | sem `DATABASE_URL`: nenhuma instalação é necessária |

**Migrations.** Arquivos SQL versionados em `backend/migrations/<banco>/`, aplicados automaticamente na inicialização e registrados na tabela `schema_migrations` (cada arquivo roda uma única vez, em transação). `npm run migrate` aplica as pendentes manualmente.

**Modelo (capítulo 6 do roteiro).**

| Tabela | Conteúdo | Observações |
|---|---|---|
| `municipios` | nome, UF, população, IDH, latitude, longitude, código IBGE | único por (nome, UF) e por código IBGE; no PostgreSQL, `coordenadas geometry(Point, 4326)` é gerada pelo banco a partir de latitude/longitude |
| `criterios` | código, nome, descrição, tipo (`beneficio`/`custo`), peso, unidade, fonte | a soma dos pesos é mantida em 1 |
| `matriz_decisao` | valor de cada critério para cada município, por ano de referência | único por (município, critério, ano); o cálculo usa o ano mais recente |
| `usuarios` | nome, e-mail, hash da senha, perfil | perfis: `admin`, `pesquisador`, `gestor` |
| `simulacoes` | usuário, título, data de execução, parâmetros (JSON) | os parâmetros guardam pesos, critérios e os valores usados, para que a simulação possa ser reaberta como foi executada |
| `resultados_ranking` | Cᵢ, D⁺, D⁻ e posição de cada município em cada simulação | gravado na mesma transação da simulação |

**PostGIS.** A migration `002_postgis.optional.sql` cria a extensão e a coluna geoespacial com índice GiST. Ela é opcional: em um PostgreSQL sem PostGIS a API registra um aviso e funciona normalmente com latitude/longitude.

**Dados iniciais.** Critérios C1–C7, municípios do exemplo 7.3, municípios da Bahia e três contas de demonstração (`src/database/seeds/dados-iniciais.js`), carregados uma única vez em um banco vazio. `npm run seed` mostra a contagem.

---

## 3. Segurança e Perfis de Acesso

Todas as rotas exigem `Authorization: Bearer <token>`, exceto `GET /api/status` e `POST /api/auth/login`.

| Operação | Administrador | Pesquisador | Gestor Público |
|---|:---:|:---:|:---:|
| Consultar municípios, critérios, histórico; executar TOPSIS; exportar relatórios | ✔ | ✔ | ✔ |
| Criar/editar/excluir critérios e pesos padrão (UC02) | ✔ | ✔ | — |
| Criar/editar/excluir municípios; importar CSV; consultar IBGE (UC01) | ✔ | — | — |
| Gerenciar usuários (RF08) | ✔ | — | — |

Detalhes das medidas de segurança em [qualidade](../qualidade/iso_25010_e_12207.md#3-medidas-de-segurança-adotadas).

---

## 4. Endpoints Principais (API RESTful)

A lista completa, com esquemas de entrada e saída, está no Swagger (`/api-docs`) e em [docs/api](../api/README.md).

| Método | Endpoint | Descrição |
|:---:|---|---|
| **GET** | `/api/municipios` | Listar municípios |
| **POST** | `/api/municipios` | Criar município |
| **PUT / DELETE** | `/api/municipios/:id` | Atualizar / remover município |
| **GET** | `/api/criterios` | Listar critérios |
| **POST / PUT / DELETE** | `/api/criterios`, `/api/criterios/:id` | Criar / atualizar / remover critério |
| **PUT** | `/api/criterios/pesos` | Atualizar os pesos padrão (soma = 1) |
| **POST** | `/api/topsis/executar` | Executar cálculo TOPSIS |
| **GET** | `/api/simulacoes` | Histórico de simulações |
| **GET** | `/api/simulacoes/:id` | Obter resultado de simulação |
| **GET** | `/api/relatorios/:id/pdf` e `/csv` | Exportar relatório |
| **POST** | `/api/auth/login` | Autenticação (emite o token JWT) |
| **GET / POST / PUT / DELETE** | `/api/usuarios` | Gerenciar usuários |
| **POST** | `/api/importacao/municipios` | Importar CSV de municípios e indicadores |
| **GET** | `/api/importacao/ibge/municipios/:codigo` | Dados do IBGE de um município |

---

## 5. Implantação

```
Navegador ──HTTP──► Nginx (contêiner frontend, porta 3000)
                      ├── arquivos estáticos da SPA
                      └── /api e /api-docs ──► Backend Node.js (porta 5000) ──► PostgreSQL + PostGIS
```

Três contêineres orquestrados pelo `docker-compose.yml`. O backend só inicia depois que o banco está saudável, e o frontend depois do backend. O banco não é publicado para fora da rede interna do Compose.
