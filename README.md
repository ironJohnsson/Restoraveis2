# Plataforma de Energia Renovável com TOPSIS
### Mensuração Multicritério de Vulnerabilidade Social Energética (ODS 7 da ONU)

[![ISO/IEC 12207](https://img.shields.io/badge/Norma-ISO%2FIEC%2012207-blue.svg)](docs/qualidade/iso_25010_e_12207.md)
[![ISO/IEC 25010](https://img.shields.io/badge/Qualidade-ISO%2FIEC%2025010-green.svg)](docs/qualidade/iso_25010_e_12207.md)
[![Tests](https://img.shields.io/badge/Testes-11%20Aprovados%20(100%25)-emerald.svg)](backend/tests/)
[![Swagger](https://img.shields.io/badge/API-OpenAPI%203.0%20%2F%20Swagger-orange.svg)](http://localhost:5000/api-docs)
[![Docker Compose](https://img.shields.io/badge/Deploy-Docker%20Compose-2496ED.svg)](docker-compose.yml)

> **Roteiro elaborado por:** Prof. Me. Celso Barreto com base nas normas ISO/IEC 12207, 15504 e 25010.  
> **Referência Oficial:** [Roteiro e Templates do Projeto TOPSIS](https://senaiba.my.canva.site/roteiro1)

---

## 📌 1. Visão Geral do Projeto

O acesso à energia renovável constitui um dos pilares essenciais para o desenvolvimento sustentável. No Brasil, populações em situação de vulnerabilidade enfrentam graves barreiras no acesso a fontes limpas, tarifas módicas e infraestrutura resiliente.

Esta **Plataforma Computacional** foi desenvolvida para mensurar indicadores multicritério de vulnerabilidade social associados ao uso e impacto da energia renovável, empregando o método matemático **TOPSIS** (*Technique for Order Preference by Similarity to Ideal Solution*), provendo:
- ✅ **Mapeamento e Diagnóstico:** Georreferenciamento de comunidades e municípios (Leaflet GIS);
- ✅ **Apoio à Tomada de Decisão:** Simulação customizável de cenários com ajuste interativo de pesos;
- ✅ **Rigor Metodológico:** Validação matemática contra o caso de referência acadêmico ($B > A > C$);
- ✅ **Relatórios Executivos:** Emissão de documentos em PDF e planilhas em CSV para subsidiar políticas públicas;
- ✅ **Qualidade de Software:** Cobertura de testes automatizados, documentação OpenAPI/Swagger e arquitetura em camadas.

---

## 🏗️ 2. Estrutura do Repositório

O projeto segue estritamente a organização arquitetural em camadas recomendada pelo roteiro:

```
Restoraveis2/
├── frontend/                     # Aplicação Single Page Application (SPA)
│   ├── src/
│   │   ├── components/           # Header, KpiCard, MapaLeaflet, RankingChart, RadarChart, etc.
│   │   ├── pages/                # Dashboard, Simulador, Mapa GIS, Municípios, Relatórios, etc.
│   │   ├── services/             # Cliente de comunicação com a API RESTful
│   │   ├── App.jsx               # Gerenciador raiz de ciclo de vida e estado global
│   │   └── main.jsx
│   ├── nginx.conf                # Configuração do proxy reverso Nginx para contêiner
│   ├── Dockerfile
│   └── package.json
│
├── backend/                      # API RESTful, Regras de Negócio e Motor TOPSIS
│   ├── src/
│   │   ├── controllers/          # Controladores (Auth, Municípios, Critérios, TOPSIS, Relatórios)
│   │   ├── services/             # Motor Matemático (topsis.service.js)
│   │   ├── database/             # Camada DAO de persistência relacional
│   │   ├── middlewares/          # Autenticação JWT, controle de acesso e tratamento de erros
│   │   ├── routes/               # Definição e roteamento dos endpoints RESTful
│   │   ├── docs/                 # Especificação OpenAPI 3.0 / Swagger (swagger.json)
│   │   ├── app.js
│   │   └── server.js
│   ├── migrations/               # Schemas DDL e Seeds de dados (PostgreSQL e SQLite)
│   ├── tests/                    # Suíte de testes unitários e de integração
│   ├── Dockerfile
│   └── package.json
│
├── docs/                         # Documentação Técnica e de Engenharia de Software
│   ├── requisitos/               # Especificação formal de requisitos (RF01-RF10, RNF01-RNF06)
│   ├── stakeholders/             # Mapeamento e matriz poder/interesse dos stakeholders
│   ├── qualidade/                # Modelo de qualidade ISO/IEC 12207 e 25010
│   ├── gestao/                   # Planejamento ágil de 8 sprints (Scrum)
│   ├── uml/                      # Diagramas UML (Casos de Uso, Classes, Sequência, etc.)
│   ├── arquitetura/              # Visão arquitetural em camadas
│   ├── manual-usuario/           # Manual passo a passo para o usuário final
│   └── apresentacao/             # Roteiro de slides para defesa oral e demonstração
│
├── docker-compose.yml            # Orquestração de contêineres (Frontend + Backend + DB PostGIS)
├── .gitignore
└── README.md
```

---

## ⚡ 3. Instruções de Instalação e Execução

### Opção A: Execução em 1 Comando via Docker Compose (Recomendado)

Certifique-se de possuir o **Docker** e o **Docker Compose** instalados:

```bash
docker-compose up -d --build
```

- **Frontend (Interface Web):** `http://localhost:3000`
- **Backend (API RESTful):** `http://localhost:5000`
- **Documentação Interativa (Swagger):** `http://localhost:5000/api-docs`

---

### Opção B: Execução Local em Modo Desenvolvimento

#### Pré-requisitos
- Node.js versão $\ge 18$ e npm instalado.

#### 1. Iniciar o Backend
```bash
cd backend
npm install
npm start
```
*O servidor inicializará automaticamente o banco de dados com migrações e dados de teste, respondendo na porta 5000.*

#### 2. Iniciar o Frontend
Em outro terminal:
```bash
cd frontend
npm install
npm run dev
```
*Acesse `http://localhost:3000` no seu navegador web.*

---

## 🧪 4. Execução dos Testes Automatizados

O projeto conta com testes unitários matemáticos para o motor TOPSIS e testes de integração de ponta a ponta da API HTTP:

```bash
cd backend
npm test
```

### Resultados dos Testes de Validação
```
# Subtest: Testes de Integração da API RESTful (Capítulos 5 e 10)
    ok 1 - GET /api/status - Deve retornar status online e conformidade ISO
    ok 2 - POST /api/auth/login - Deve autenticar usuário cadastrado e retornar token JWT
    ok 3 - GET /api/municipios - Deve retornar lista de municípios com indicadores
    ok 4 - GET /api/criterios - Deve retornar 7 critérios do modelo de vulnerabilidade
    ok 5 - POST /api/topsis/executar - Deve calcular o ranking TOPSIS e persistir a simulação
    ok 6 - GET /api/relatorios/:id/csv - Deve gerar e retornar arquivo CSV com cabeçalhos
# Subtest: Testes Unitários — Motor TOPSIS (ISO/IEC 25010 & Capítulo 10)
    ok 1 - Deve calcular corretamente a normalização vetorial preservando proporções
    ok 2 - Deve tratar vetores com valor zero sem gerar NaN ou divisão por zero
    ok 3 - Deve validar o Benchmark Numérico da Seção 7.3 do Roteiro (B > A > C)
    ok 4 - Deve lançar erro ao receber matriz de decisão com dimensões inconsistentes
    ok 5 - Deve manter a soma proporcional dos pesos igual a 1 quando os pesos não somarem 1

# tests 11 | pass 11 | fail 0 (100% de sucesso)
```

---

## 📊 5. Indicadores do Modelo Multicritério TOPSIS

| Cód | Indicador | Tipo | Unidade | Fonte Oficial | Peso Padrão |
|:---:|---|:---:|:---:|:---:|:---:|
| **C1** | % domicílios sem acesso à eletricidade | **Custo** | `%` | IBGE | 0.20 |
| **C2** | Capacidade instalada solar fotovoltaica | **Benefício** | `kW/hab` | ANEEL | 0.20 |
| **C3** | Rendimento domiciliar per capita | **Benefício** | `R$` | IBGE | 0.15 |
| **C4** | Tarifa média de energia elétrica | **Custo** | `R$/kWh` | ANEEL | 0.25 |
| **C5** | Índice de irradiação solar global média | **Benefício** | `kWh/m²/dia` | INPE | 0.20 |
| **C6** | % população em extrema pobreza | **Custo** | `%` | IBGE | 0.00 |
| **C7** | Nº projetos de energia renovável ativos | **Benefício** | `unidades` | ANEEL | 0.00 |

---

## 🔑 6. Usuários e Perfis de Acesso Pré-configurados

| Perfil | E-mail | Senha Padrão |
|---|---|:---:|
| **Administrador** | `admin@topsis.gov.br` | `123456` |
| **Pesquisador** | `pesquisador@topsis.gov.br` | `123456` |
| **Gestor Público** | `gestor@topsis.gov.br` | `123456` |

---

## 📋 7. Checklist de Conformidade do Roteiro

- [x] Repositório Git com histórico de commits organizado e em língua portuguesa
- [x] README.md completo com instruções de instalação e execução
- [x] Docker Compose funcional com 1 comando (`docker-compose up -d`)
- [x] Documentação de Requisitos (RF01 a RF10 e RNF01 a RNF06)
- [x] Diagramas UML completos (Casos de Uso, Classes, Sequência, Atividades, Componentes, Implantação)
- [x] Banco de dados modelado com migrations e dados de teste (Benchmark e Cidades da Bahia)
- [x] API RESTful documentada interativamente via Swagger/OpenAPI 3.0
- [x] Algoritmo TOPSIS implementado com validação matemática estrita ($B > A > C$)
- [x] Frontend responsivo com dashboard de KPIs, gráficos analíticos e mapas Leaflet
- [x] Testes automatizados unitários e de integração com 100% de aprovação
- [x] Manual do Usuário e Operação completo
- [x] Roteiro e slides preparados para defesa oral e apresentação técnica

---

## 📄 8. Licença e Créditos
Este projeto foi desenvolvido com finalidade acadêmica e técnica, baseado no roteiro metodológico do **Prof. Me. Celso Barreto**, sob a licença [MIT](LICENSE).
