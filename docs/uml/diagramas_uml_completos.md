# Modelagem UML Completa do Sistema
## Plataforma de Energia Renovável com TOPSIS
**Conforme Capítulo 4 do Roteiro Metodológico**

---

## 4.1 Diagrama de Casos de Uso

```mermaid
flowchart LR
    subgraph Atores
        Admin["Administrador"]
        Pesq["Pesquisador"]
        Gestor["Gestor Público"]
    end

    subgraph Plataforma TOPSIS
        UC01(["UC01: Cadastrar Município"])
        UC02(["UC02: Configurar Critérios TOPSIS"])
        UC03(["UC03: Executar Simulação TOPSIS"])
        UC04(["UC04: Gerar e Exportar Relatórios"])
        UC05(["UC05: Visualizar Mapa Georreferenciado"])
        UC06(["UC06: Autenticar no Sistema"])
    end

    Admin --> UC01
    Admin --> UC06
    Pesq --> UC02
    Pesq --> UC03
    Pesq --> UC04
    Pesq --> UC05
    Pesq --> UC06
    Gestor --> UC03
    Gestor --> UC04
    Gestor --> UC05
    Gestor --> UC06
```

### Especificação Textual dos Principais Casos de Uso

#### UC01 — Cadastrar Município
- **Ator Primário:** Administrador
- **Pré-condição:** Administrador autenticado no sistema com perfil válido.
- **Fluxo Principal:**
  1. O Administrador acessa a aba "Municípios" e seleciona "Cadastrar Novo Município".
  2. O sistema exibe o formulário solicitando Nome, UF, População, IDH, Latitude e Longitude.
  3. O Administrador preenche os dados e clica em "Salvar".
  4. O sistema valida os campos obrigatórios e verifica a unicidade do par (Nome, UF).
  5. O sistema persiste as informações no banco de dados e atualiza a listagem.
  6. O sistema exibe mensagem de confirmação de cadastro bem-sucedido.

#### UC02 — Configurar Critérios TOPSIS
- **Ator Primário:** Pesquisador
- **Fluxo Principal:**
  1. O Pesquisador acessa a tela de "Configuração de Critérios".
  2. O sistema apresenta a lista de indicadores cadastrados (C1 a C7) com pesos atuais e tipos.
  3. O Pesquisador ajusta os sliders de ponderação ou altera o direcionamento (Benefício ou Custo).
  4. O sistema valida automaticamente se a somatória dos pesos atinge $1,0$ ($100\%$).
  5. O sistema salva a configuração para uso na simulação corrente.

#### UC03 — Executar TOPSIS
- **Atores:** Pesquisador, Gestor Público
- **Fluxo Principal:**
  1. O ator seleciona os municípios a serem incluídos na análise comparativa.
  2. O ator revisa os critérios selecionados e aciona "Calcular TOPSIS".
  3. O sistema despacha a matriz de decisão ao motor matemático.
  4. O motor executa a normalização vetorial, calcula $A^+$, $A^-$, as distâncias euclidianas e o coeficiente $C_i$.
  5. O sistema armazena a simulação no histórico e renderiza os gráficos de ranking, tabela detalhada e mapa temático.

#### UC04 — Gerar Relatório
- **Ator Primário:** Gestor Público
- **Fluxo Principal:**
  1. O Gestor visualiza os resultados de uma simulação TOPSIS.
  2. O Gestor seleciona o formato de exportação desejado (PDF analítico ou planilha CSV).
  3. O sistema compila a síntese metodológica, dados brutos, pesos aplicados e ranking final.
  4. O arquivo gerado é transferido para o dispositivo do usuário.

---

## 4.2 Diagrama de Classes de Domínio

```mermaid
classDiagram
    class Municipio {
        +int id
        +string nome
        +string uf
        +int populacao
        +float idh
        +float latitude
        +float longitude
        +DateTime created_at
    }

    class Criterio {
        +int id
        +string codigo
        +string nome
        +string descricao
        +string tipo
        +float peso_padrao
        +string unidade
        +string fonte
    }

    class MatrizDecisao {
        +int id
        +int municipio_id
        +int criterio_id
        +float valor
        +int ano_referencia
    }

    class SimulacaoTOPSIS {
        +int id
        +int usuario_id
        +DateTime data_execucao
        +json parametros
        +string status
    }

    class ResultadoRanking {
        +int id
        +int simulacao_id
        +int municipio_id
        +float coeficiente_ci
        +float distancia_positiva
        +float distancia_negativa
        +int posicao
    }

    class Usuario {
        +int id
        +string nome
        +string email
        +string senha_hash
        +string perfil
    }

    Municipio "1" <-- "*" MatrizDecisao : compoe
    Criterio "1" <-- "*" MatrizDecisao : referencia
    SimulacaoTOPSIS "1" --> "*" ResultadoRanking : gera
    Municipio "1" <-- "*" ResultadoRanking : classifica
    Usuario "1" --> "*" SimulacaoTOPSIS : executa
```

---

## 4.3 Diagrama de Sequência — Execução do TOPSIS

```mermaid
sequenceDiagram
    autonumber
    actor Usuario as Pesquisador / Gestor
    participant Front as Frontend (React UI)
    participant API as API Controller (Express)
    participant Engine as TOPSIS Service
    participant DB as Banco de Dados

    Usuario->>Front: Seleciona pesos e clica "Executar TOPSIS"
    Front->>API: POST /api/topsis/executar {criterios, pesos, municipioIds}
    API->>DB: Consulta valores da Matriz de Decisão
    DB-->>API: Retorna matriz de dados brutos
    API->>Engine: calcular(matriz, pesos, tipos)
    Note over Engine: Passo 1: Normalização Vetorial r_ij
    Note over Engine: Passo 2: Matriz Ponderada v_ij = w_j * r_ij
    Note over Engine: Passo 3: Determinar Soluções Ideais A+ e A-
    Note over Engine: Passo 4: Calcular Distâncias Euclidianas D+ e D-
    Note over Engine: Passo 5: Coeficiente de Proximidade Ci = D- / (D+ + D-)
    Note over Engine: Passo 6: Ordenação do Ranking
    Engine-->>API: Retorna ranking detalhado e estatísticas
    API->>DB: Salva registro da Simulação e Resultados
    DB-->>API: Confirmação de persistência
    API-->>Front: 200 OK {simulacaoId, ranking, metricas}
    Front-->>Usuario: Renderiza Dashboard (Gráficos, Mapa e Tabela)
```

---

## 4.4 Diagrama de Atividades — Algoritmo TOPSIS

```mermaid
flowchart TD
    Start([Início]) --> A[Selecionar Municípios / Alternativas]
    A --> B[Definir Critérios e Atribuir Pesos]
    B --> C[Construir Matriz de Decisão X_mxn]
    C --> D[Calcular Norma Vetorial das Colunas]
    D --> E["Normalizar Matriz: r_ij = x_ij / √(Σ x_kj²)"]
    E --> F["Ponderar Matriz: v_ij = w_j * r_ij"]
    F --> G["Determinar Solução Ideal Positiva A+"]
    G --> H["Determinar Solução Ideal Negativa A-"]
    H --> I["Calcular Distância Euclidiana D+ para cada alternativa"]
    I --> J["Calcular Distância Euclidiana D- para cada alternativa"]
    J --> K["Calcular Coeficiente de Proximidade Ci = D- / (D+ + D-)"]
    K --> L["Ordenar alternativas em ordem decrescente de Ci"]
    L --> M[Apresentar Classificação e Mapas Temáticos]
    M --> EndNode([Fim])
```

---

## 4.5 Diagrama de Componentes

```mermaid
flowchart TD
    subgraph Frontend ["Subsistema Frontend (React + Vite + TailwindCSS)"]
        UI_Dash["Dashboard Component"]
        UI_Map["Leaflet GIS Map Component"]
        UI_Form["Formulários e Sliders Component"]
        UI_Report["Gerador de Relatórios (PDF/CSV)"]
    end

    subgraph Backend ["Subsistema Backend (Node.js + Express)"]
        C_Auth["Auth Controller (JWT/bcrypt)"]
        C_Mun["Município Controller"]
        C_Crit["Critérios Controller"]
        C_Topsis["TOPSIS Controller"]
        S_Topsis["Motor Matemático TOPSIS"]
        M_Layer["Camada de Modelos e Persistência"]
    end

    subgraph Persistencia ["Camada de Armazenamento"]
        DB_SQL[("Banco Relacional: SQLite / PostgreSQL")]
    end

    UI_Dash -->|REST / JSON| C_Topsis
    UI_Map -->|REST / JSON| C_Mun
    UI_Form -->|REST / JSON| C_Crit
    UI_Report -->|REST / JSON| C_Topsis

    C_Topsis --> S_Topsis
    C_Topsis --> M_Layer
    C_Mun --> M_Layer
    C_Crit --> M_Layer
    C_Auth --> M_Layer

    M_Layer -->|SQL / Queries| DB_SQL
```

---

## 4.6 Diagrama de Implantação

```mermaid
flowchart LR
    subgraph Cliente ["Dispositivo Cliente"]
        Browser["Navegador Web (Chrome/Firefox/Edge)"]
    end

    subgraph Host ["Ambiente Servidor / Docker"]
        subgraph Proxy ["Proxy Reverso"]
            Nginx["Nginx Web Server (Porta 80 / 443)"]
        end

        subgraph Containers ["Contêineres de Aplicação"]
            AppFront["Frontend Container (Porta 3000 / Vite Build)"]
            AppBack["Backend API Container (Porta 5000 / Node.js)"]
            DBServer[("Database Container (PostgreSQL + PostGIS / SQLite)")]
        end
    end

    Browser -->|HTTP / HTTPS| Nginx
    Nginx -->|Roteamento estático| AppFront
    Nginx -->|Roteamento /api/*| AppBack
    AppBack -->|Conexão TCP / Pool| DBServer
```
