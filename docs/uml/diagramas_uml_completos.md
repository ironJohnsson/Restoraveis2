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
        UC07(["UC07: Gerenciar Usuários e Perfis"])
        UC08(["UC08: Importar Dados Externos (CSV / IBGE)"])
    end

    Admin --> UC01
    Admin --> UC07
    Admin --> UC08
    Admin --> UC02
    Pesq --> UC02
    Pesq --> UC03
    Gestor --> UC03
    Gestor --> UC04
    Gestor --> UC05
    Pesq --> UC04
    Pesq --> UC05
    Admin --> UC06
    Pesq --> UC06
    Gestor --> UC06
```

O Administrador também pode executar UC03, UC04 e UC05 (omitidos no diagrama para não poluí-lo). Todos os casos de uso têm como pré-condição o UC06.

### Especificação Textual dos Principais Casos de Uso

#### UC01 — Cadastrar Município
- **Ator Primário:** Administrador
- **Pré-condição:** Administrador autenticado no sistema com perfil válido.
- **Fluxo Principal:**
  1. O Administrador acessa a aba "Municípios" e seleciona "Novo Município".
  2. O sistema exibe o formulário com Nome, UF, Código IBGE, População, IDH, Latitude, Longitude e um campo por critério.
  3. O Administrador preenche os dados (ou usa "Preencher com dados do IBGE") e clica em "Salvar Município".
  4. O sistema valida os campos e verifica a unicidade do par (Nome, UF) e do código IBGE.
  5. O sistema persiste o município e seus indicadores em uma única transação e atualiza a listagem.
  6. O sistema exibe mensagem de confirmação.
- **Fluxos Alternativos:** dados inválidos ou município já cadastrado — o sistema informa o motivo e mantém o formulário aberto. Os mesmos passos valem para editar e excluir.

#### UC02 — Configurar Critérios TOPSIS
- **Ator Primário:** Pesquisador
- **Fluxo Principal:**
  1. O Pesquisador acessa a aba "Critérios".
  2. O sistema apresenta os indicadores cadastrados com tipo, unidade, fonte e peso.
  3. O Pesquisador cria, edita ou exclui critérios, altera o tipo (Benefício ou Custo) e ajusta os sliders de peso.
  4. O sistema só permite salvar os pesos quando a soma é $1,0$ ($100\%$).
  5. O sistema grava a configuração, que passa a ser o padrão das próximas simulações.

#### UC03 — Executar TOPSIS
- **Atores:** Pesquisador, Gestor Público
- **Fluxo Principal:**
  1. O ator seleciona os municípios a serem incluídos na análise comparativa.
  2. O ator revisa os pesos (ou escolhe um cenário) e aciona "Executar Cálculo TOPSIS".
  3. O sistema monta a matriz de decisão com os valores vigentes e a envia ao motor matemático.
  4. O motor executa a normalização vetorial, calcula $A^+$, $A^-$, as distâncias euclidianas e o coeficiente $C_i$.
  5. O sistema armazena a simulação no histórico e exibe os gráficos de ranking, a tabela detalhada e o mapa.
- **Fluxo Alternativo:** municípios sem dado em algum critério ponderado ficam fora do cálculo e são listados em um aviso; com menos de 2 alternativas completas o cálculo não é executado.

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
        +string codigo_ibge
        +DateTime created_at
    }

    class Criterio {
        +int id
        +string codigo
        +string nome
        +string descricao
        +string tipo
        +float peso
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
        +string titulo
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
        +DateTime created_at
    }

    class TopsisService {
        <<service>>
        +normalizarMatriz(matriz)
        +calcularMatrizPonderada(normalizada, pesos)
        +calcularSolucoesIdeais(ponderada, tipos)
        +calcularDistanciasEuclidianas(ponderada, aPlus, aMinus)
        +calcularCoeficienteProximidade(dPlus, dMinus)
        +executar(alternativas, criterios, pesos, matriz)
    }

    Municipio "1" <-- "*" MatrizDecisao : compoe
    Criterio "1" <-- "*" MatrizDecisao : referencia
    SimulacaoTOPSIS "1" --> "*" ResultadoRanking : gera
    Municipio "1" <-- "*" ResultadoRanking : classifica
    Usuario "1" --> "*" SimulacaoTOPSIS : executa
    TopsisService ..> MatrizDecisao : lê
    TopsisService ..> ResultadoRanking : produz
```

---

## 4.3 Diagrama de Sequência — Execução do TOPSIS

```mermaid
sequenceDiagram
    autonumber
    actor Usuario as Pesquisador / Gestor
    participant Front as Frontend (React)
    participant API as API (rotas + auth + controller)
    participant Sim as SimulacaoService
    participant Engine as TopsisService
    participant DB as Banco de Dados

    Usuario->>Front: Ajusta os pesos e clica "Executar Cálculo TOPSIS"
    Front->>API: POST /api/topsis/executar {pesosPersonalizados, municipioIds} + token JWT
    API->>API: Valida o token e o perfil
    API->>Sim: executar(payload, usuario)
    Sim->>DB: Consulta critérios, municípios e valores vigentes da matriz
    DB-->>Sim: Dados brutos
    Sim->>Sim: Separa municípios com dados incompletos
    Sim->>Engine: executar(alternativas, criterios, pesos, matriz)
    Note over Engine: normalizar()
    Note over Engine: calcularPonderada()
    Note over Engine: idealPositiva() e idealNegativa()
    Note over Engine: distancias()
    Note over Engine: coeficienteProximidade()
    Engine-->>Sim: ranking[] e estatísticas
    Sim->>DB: salvarSimulacao(resultado) em uma transação
    DB-->>Sim: id da simulação
    Sim-->>API: resultado
    API-->>Front: 200 OK {simulacaoId, ranking, criteriosInfo, alternativasExcluidas}
    Front-->>Usuario: Exibe dashboard com ranking, radar e mapa
```

---

## 4.4 Diagrama de Atividades — Algoritmo TOPSIS

```mermaid
flowchart TD
    Start([Início]) --> A[Selecionar Municípios / Alternativas]
    A --> B[Definir Critérios e Atribuir Pesos]
    B --> B2{Todos os dados dos critérios ponderados estão preenchidos?}
    B2 -->|Não| B3[Separar o município como alternativa não avaliada]
    B3 --> C
    B2 -->|Sim| C[Construir Matriz de Decisão X_mxn]
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
        UI_Login["Login e sessão (useAuth)"]
        UI_Dash["Dashboard (KPIs, ranking, radar)"]
        UI_Map["Mapa Leaflet (marcadores e calor)"]
        UI_Form["Formulários: municípios, critérios, usuários"]
        UI_Api["Cliente da API (services/api.js)"]
    end

    subgraph Backend ["Subsistema Backend (Node.js + Express)"]
        Auth["AuthModule (JWT, bcrypt, perfis)"]
        Ctrl["Controllers"]
        Topsis["TOPSISEngine (TopsisService + SimulacaoService)"]
        Import["DataImport (CSV, IBGE, ViaCEP)"]
        Report["Relatórios (PDF / CSV)"]
        Models["Models (repositórios SQL)"]
    end

    subgraph Persistencia ["Armazenamento"]
        DB_SQL[("PostgreSQL + PostGIS / SQLite")]
    end

    Externo["APIs públicas: IBGE e ViaCEP"]

    UI_Login --> UI_Api
    UI_Dash --> UI_Api
    UI_Map --> UI_Api
    UI_Form --> UI_Api
    UI_Api -->|REST / JSON + JWT| Auth
    Auth --> Ctrl
    Ctrl --> Topsis
    Ctrl --> Import
    Ctrl --> Report
    Ctrl --> Models
    Topsis --> Models
    Import --> Models
    Import -->|HTTPS| Externo
    Report --> Topsis
    Models -->|SQL| DB_SQL
```

---

## 4.6 Diagrama de Implantação

```mermaid
flowchart LR
    subgraph Cliente ["Dispositivo Cliente"]
        Browser["Navegador Web (Chrome / Firefox / Safari / Edge)"]
    end

    subgraph Host ["Servidor com Docker Compose"]
        subgraph CFront ["Contêiner frontend (porta 3000)"]
            Nginx["Nginx: arquivos da SPA + proxy reverso"]
        end
        subgraph CBack ["Contêiner backend (porta 5000)"]
            Node["App Server Node.js + Express"]
        end
        subgraph CDb ["Contêiner db (rede interna)"]
            DBServer[("PostgreSQL 16 + PostGIS")]
        end
    end

    Browser -->|HTTP / HTTPS| Nginx
    Nginx -->|/api e /api-docs| Node
    Node -->|TCP 5432, pool de conexões| DBServer
```

Em desenvolvimento, sem Docker, o backend usa um arquivo SQLite local e o Vite faz o papel de proxy.
