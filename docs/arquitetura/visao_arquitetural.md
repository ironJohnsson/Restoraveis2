# Visão da Arquitetura do Sistema
## Plataforma de Energia Renovável com TOPSIS
**Conforme Capítulo 5 do Roteiro Metodológico**

---

## 1. Padrão Arquitetural em Camadas

A arquitetura do sistema adota o padrão em camadas desacopladas (Clean Architecture / MVC expandido), assegurando alta coesão e baixo acoplamento conforme as diretrizes da norma ISO/IEC 12207:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Camada de Apresentação                          │
│     React 18 + Vite + TailwindCSS + Leaflet (Mapas) + Chart.js / Recharts │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Chamadas RESTful (JSON sobre HTTP)
┌───────────────────────────────────▼────────────────────────────────────┐
│                      Camada de Aplicação (API)                         │
│     Express Router → Controllers → Middlewares (Auth JWT, CORS, Logs)   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│                         Camada de Domínio                              │
│     Motor Matemático TOPSIS + Regras de Negócio + Validações           │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│                    Camada de Infraestrutura e Dados                    │
│     Camada DAO / Repositório Relacional (SQLite / PostgreSQL PostGIS) │
└────────────────────────────────────────────────────────────────────────┘
```

### Detalhamento das Responsabilidades
1. **Camada de Apresentação (Frontend):**
   - Single Page Application (SPA) construída com React e Vite para máxima performance e inicialização instantânea;
   - Estilização com TailwindCSS proporcionando interface limpa, intuitiva e responsiva (atendendo ao RNF02);
   - Visualização cartográfica via Leaflet para plotagem dos municípios com marcadores dinâmicos categorizados pela intensidade de vulnerabilidade;
   - Gráficos analíticos interativos (ranking em barras horizontais e gráfico radar multicritério).

2. **Camada de Aplicação / Controladores (Backend API):**
   - Roteamento RESTful com validação de payload de requisições;
   - Middlewares para controle de autenticação JWT, CORS, tratamento global de exceções e auditoria;
   - Exposição da documentação interativa Swagger/OpenAPI 3.0 no caminho `/api-docs`.

3. **Camada de Domínio / Serviços (Business Logic):**
   - Serviço desacoplado `TopsisService` responsável pela manipulação matricial pura;
   - Implementação sem estado (*stateless*), viabilizando paralelismo e facilidade para testes unitários com cobertura superior a 80% (RNF05).

4. **Camada de Persistência / Infraestrutura:**
   - Suporte híbrido transparente: motor nativo SQLite (zero dependência externa para execução e testes locais) e PostgreSQL com extensão PostGIS para implantação em ambiente corporativo/Docker.

---

## 2. Especificação dos Endpoints Principais (API RESTful)

| Método | Endpoint | Descrição da Operação | Parâmetros / Corpo | Código Sucesso |
|:---:|---|---|---|:---:|
| **GET** | `/api/status` | Verificação de saúde da API (Health Check). | Nenhum | `200 OK` |
| **POST** | `/api/auth/login` | Autenticação e emissão de token JWT. | `{ email, senha }` | `200 OK` |
| **GET** | `/api/municipios` | Listar todos os municípios com indicadores e coordenadas. | Query: `?uf=BA` (opcional) | `200 OK` |
| **POST** | `/api/municipios` | Cadastrar novo município com dados socioeconômicos. | `{ nome, uf, populacao, idh, latitude, longitude }` | `201 Created` |
| **PUT** | `/api/municipios/:id`| Atualizar dados de um município existente. | Objeto parcial | `200 OK` |
| **DELETE**| `/api/municipios/:id`| Remover município do sistema. | `:id` | `200 OK` |
| **GET** | `/api/criterios` | Listar indicadores e critérios de vulnerabilidade com pesos atuais. | Nenhum | `200 OK` |
| **PUT** | `/api/criterios/pesos`| Atualizar os pesos e preferências dos critérios TOPSIS. | `{ pesos: { C1: 0.20, ... } }` | `200 OK` |
| **POST** | `/api/topsis/executar`| Executar cálculo matricial TOPSIS e gerar ranking ordenado. | `{ pesos, criterios, municipioIds }` | `200 OK` |
| **GET** | `/api/simulacoes` | Listar histórico de simulações realizadas. | Paginação opcional | `200 OK` |
| **GET** | `/api/simulacoes/:id`| Recuperar snapshot completo de simulação específica. | `:id` | `200 OK` |
| **GET** | `/api/relatorios/:id/csv`| Exportar resultado em formato tabular CSV delimitado. | `:id` | `200 OK` (File) |
| **GET** | `/api/relatorios/:id/pdf`| Gerar e exportar relatório formatado em PDF. | `:id` | `200 OK` (File) |
