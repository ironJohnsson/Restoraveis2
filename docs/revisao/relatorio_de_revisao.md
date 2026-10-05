# Relatório de Revisão do Projeto
## Plataforma de Energia Renovável com TOPSIS

Revisão do código em relação ao [roteiro do projeto](../referencias/roteiro.txt), realizada em 05/10/2026.
Este documento registra **os erros encontrados**, **o que foi corrigido ou acrescentado** e **o que ainda
depende de verificação ou da equipe**.

---

## 1. Resumo

| | Antes da revisão | Depois da revisão |
|---|---|---|
| Testes de backend | 11, todos passando mesmo com os erros abaixo | 214 (58 unitários e 156 de integração) |
| Cobertura de linhas | 62,9% (meta do roteiro: 80%) | 99,5%; o `npm test` falha abaixo de 80% |
| Testes de sistema (navegador) | nenhum | 18 (Playwright) |
| Rotas que exigem login | 1 de 17 | todas, exceto login e verificação de saúde |
| Banco no Docker Compose | PostgreSQL subia, mas a API gravava em SQLite | a API usa o PostgreSQL + PostGIS |
| Requisitos funcionais atendidos | RF02, RF08 e RF09 incompletos ou ausentes; RF06 e RF10 quebrados | RF01 a RF10 implementados (ressalva no RF09, seção 5) |
| Integração contínua | nenhuma | GitHub Actions com 5 etapas |

---

## 2. Erros Encontrados

Todos foram confirmados executando o sistema, não apenas lendo o código.

### 2.1 Graves

| # | Erro | Onde estava | Efeito para o usuário | Correção |
|:---:|---|---|---|---|
| 1 | O id de todo registro recém-criado voltava como **0**. O banco era regravado em disco antes de o id ser lido, e essa regravação zera o valor. | `backend/src/database/db.js` | Os resultados de todas as simulações eram gravados na simulação 0: histórico com "0 municípios", CSV só com o cabeçalho e PDF sem linhas. Os botões CSV/PDF sumiam do dashboard. Os indicadores de um município novo iam para o município 0, e ele entrava no ranking com todos os valores zerados. | Inserções passam a devolver o id na própria instrução (`INSERT ... RETURNING id`), e gravações compostas rodam em transação. Uma migration remove os registros órfãos de bancos antigos. |
| 2 | **Qualquer conta entrava com a senha `123456`**, inclusive contas criadas com outra senha. O hash das contas de demonstração não correspondia a nenhuma senha, e esse atalho compensava. | `backend/src/controllers/auth.controller.js` | Bastava saber o e-mail de alguém para entrar como essa pessoa. | Atalho removido. As contas de demonstração recebem um hash válido; bancos antigos são consertados na inicialização. |
| 3 | **Nenhuma rota era protegida.** A verificação de token só era aplicada a `/auth/me`, e a verificação de perfil nunca era usada. | `backend/src/routes/` | Qualquer pessoa, sem login, podia apagar municípios e alterar pesos. O cadastro público aceitava `perfil: "admin"`. A interface nem tinha tela de login. | Todas as rotas exigem token e verificam o perfil conforme os casos de uso. O cadastro público foi removido: usuários são criados pelo Administrador. Tela de login e controle de perfis na interface. |
| 4 | **Dado ausente era tratado como zero.** | `backend/src/controllers/topsis.controller.js` | Um município sem valor em critérios de custo (tarifa, % sem eletricidade) era favorecido: ficou em 2º lugar de 14 no teste. | O município sem dado em critério com peso maior que zero fica fora do cálculo e é listado em um aviso, com os critérios que faltam. |
| 5 | **O PostgreSQL do Docker Compose não era usado.** O backend ignorava `DATABASE_URL`, não tinha o driver do PostgreSQL e gravava em um arquivo SQLite dentro do contêiner, sem volume. | `docker-compose.yml`, `backend/` | Os dados sumiam ao recriar o contêiner, e o banco exigido pelo roteiro ficava vazio. | Adaptadores para SQLite e PostgreSQL com o mesmo SQL; com `DATABASE_URL` a API usa o PostgreSQL. Migrations próprias para cada banco, incluindo a coluna geoespacial do PostGIS. |

### 2.2 Médios

| # | Erro | Efeito | Correção |
|:---:|---|---|---|
| 6 | A tela inicial executava e **salvava uma simulação a cada carregamento** da página. | Histórico cheio de "Simulação Padrão" repetidas. | A tela abre com a última simulação salva; se não houver, calcula uma prévia sem gravar. |
| 7 | A data da simulação era gravada em UTC sem fuso e lida como hora local. | Horário exibido **3 horas adiantado**. | Datas gravadas e devolvidas em ISO 8601 com fuso. |
| 8 | Pesos aceitavam qualquer valor (`5`, `-3`); tipo de critério inválido causava erro 500. | Dados inconsistentes e erros sem explicação. | Validação de todas as entradas, com mensagem indicando o campo. Os pesos só são gravados se a soma for 1,0. |
| 9 | O nome do município era inserido como HTML no popup do mapa. | Um nome com `<script>` ou `<img onerror>` executava código no navegador de quem abrisse o mapa (XSS). | O popup é montado com texto puro. O CSV também é protegido contra injeção de fórmulas. |
| 10 | Comparação de nomes sem diferenciar maiúsculas falhava com acentos no SQLite ("IRECÊ" ≠ "Irecê"). | Município duplicado passava pela validação. *Encontrado pelos novos testes.* | Comparação de nomes sem acentos e sem maiúsculas, feita na aplicação. |
| 11 | A mensagem de login diferenciava "usuário não encontrado" de "senha incorreta". | Permitia descobrir quais e-mails tinham conta. | Mensagem única: "Credenciais inválidas". Limite de tentativas por IP. |

### 2.3 Menores

| # | Erro | Correção |
|:---:|---|---|
| 12 | `iniciar.bat` e `iniciar.ps1` tinham o caminho fixo `C:\Users\Matheus Johnsson\...` e só funcionavam naquela máquina. | Usam o Node do PATH, avisam se não houver e instalam as dependências. Novo `iniciar.sh`. |
| 13 | `npm run seed` apontava para um arquivo inexistente. | `seed.js` e `migrate.js` criados. |
| 14 | Os testes gravavam no banco de desenvolvimento, deixando simulações de teste. | Banco em memória, isolado por arquivo de teste. |
| 15 | O segredo do JWT estava fixo no código e no `docker-compose.yml`. | Lido de variável de ambiente ou gerado aleatoriamente na primeira execução. |
| 16 | No celular (375 px), o cabeçalho causava rolagem horizontal. *Encontrado pelos testes E2E.* | Cabeçalho reorganizado; verificado em 375, 820 e 1366 px. |
| 17 | O gráfico radar usava um hook do React depois de um retorno condicional. | Corrigido; o radar usa os critérios da própria simulação. |
| 18 | O tempo exibido como "tempo de execução" media só o algoritmo (3 ms), não a requisição. | Passa a exibir o tempo total no servidor, que é o que o RNF01 pede. |

### 2.4 Por que os 11 testes antigos passavam

Os testes verificavam apenas que `simulacaoId` era um número (0 é um número) e que o CSV tinha cabeçalho.
Nenhum conferia se os resultados estavam vinculados à simulação, e nenhum testava acesso sem login.

---

## 3. O Que Faltava em Relação ao Roteiro

| Item do roteiro | Situação encontrada | O que foi feito |
|---|---|---|
| RF02 — cadastrar critérios | Só listagem e alteração; sem tela | Criar, editar e excluir critérios; aba **Critérios** com tabela editável |
| Tela "Configuração TOPSIS" com seletor benefício/custo | Só sliders, e os pesos não eram gravados | Seletor de tipo, sliders e gravação dos pesos com soma = 1,0 |
| RF01 — CRUD de municípios | Interface só criava e excluía | Edição na interface |
| Formulário com "busca por CEP/IBGE" | Ausente | Preenchimento pelo código IBGE, CEP ou nome |
| RF08 — usuários e perfis | Sem tela e sem controle | Login, aba **Usuários**, troca de senha, três perfis |
| RF09 — importar dados externos | Ausente (documentação dizia "100% dos RF") | Importação de CSV e consulta à API do IBGE |
| Mapa com "camadas de calor por indicador" | Só marcadores | Camada de calor com seleção do indicador |
| Cobertura de testes ≥ 80% | 62,9% | 99,5% das linhas, com limite imposto |
| Teste de sistema E2E | Ausente | 18 testes no navegador |
| CI/CD (GitHub Actions) | Ausente | `.github/workflows/ci.yml` |
| Capítulo 8 — protótipos de telas | Ausente | 5 wireframes em `docs/prototipos/` |
| Estrutura: `models/`, `hooks/`, `utils/`, `public/`, `docs/api/` | Ausentes | Criados |
| Camada de repositórios | SQL dentro dos controllers | SQL concentrado em `models/`; regras em `services/` |
| Endpoint `GET /api/simulacoes/:id` | Existia só como `/api/topsis/simulacoes/:id` | Caminho do roteiro criado; o antigo continua aceito |
| Swagger | Faltavam 7 das 17 rotas e o esquema de autenticação | Todas as rotas documentadas; um teste impede rota sem documentação |
| Documentação | Citava Jest, Chart.js e testes que não existiam | Reescrita para corresponder ao código |

---

## 4. Como Foi Verificado

| Verificação | Resultado |
|---|---|
| Testes de backend em SQLite, com cobertura | 214 passam; 98,9% das instruções, 90,8% dos ramos, 99,5% das linhas |
| A mesma suíte contra um PostgreSQL 18 real | 214 passam |
| Testes de sistema no Google Chrome | 18 passam |
| Exemplo numérico 7.3 do roteiro | B > A > C, com Cᵢ = 1,0000; 0,3361; 0,0000, conferidos com cálculo feito fora da aplicação |
| RNF01 — 500 alternativas em menos de 3 s | Requisição completa com 513 alternativas dentro do limite |
| Build de produção do frontend | Sem erros |
| `npm audit` das dependências de produção | 0 vulnerabilidades em backend e frontend |

### Não verificado

A máquina usada na revisão não tinha acesso ao Docker. Por isso:

- **Docker Compose:** `docker-compose.yml`, os Dockerfiles e a configuração do Nginx foram reescritos, mas não executados.
- **Migration do PostGIS:** não foi executada (o PostgreSQL usado no teste não tinha a extensão). Ela é opcional por projeto: se falhar, a API registra um aviso e funciona com latitude/longitude.
- **GitHub Actions:** o workflow só foi validado como YAML. O primeiro push mostrará se as 5 etapas passam; a etapa `docker` é a que exercita os dois itens acima.
- **Commits intermediários:** os testes foram executados sobre o resultado final, não sobre cada commit isolado.

---

## 5. Decisões e Pendências

- **Playwright no lugar do Cypress.** O roteiro cita o Cypress como exemplo de ferramenta E2E. Foi usado o Playwright, equivalente, porque roda com o navegador já instalado. Os cenários são os mesmos.
- **Sem ORM e sem biblioteca de gráficos.** O roteiro recomenda Prisma/Sequelize e Chart.js/Recharts. O projeto mantém SQL direto (em `models/`) e gráficos próprios em SVG; a documentação agora diz isso.
- **RF09 parcial.** A consulta automática cobre só o IBGE (nome, UF, população e coordenadas). Dados da ANEEL e do INPE entram por importação de CSV.
- **Indicadores ilustrativos.** Os valores dos municípios da Bahia nos dados iniciais não são oficiais; servem para demonstração.
- **RNF03 (disponibilidade de 99,5%).** É uma meta operacional, não medida.
- **Slides.** Existe o roteiro em `docs/apresentacao/`; o arquivo de slides ainda precisa ser montado pela equipe.
- **Cronograma.** As sprints 1 a 7 foram marcadas como concluídas em `docs/gestao/`; confira com as datas reais.
- **Selo do CI no README.** Aponta para `ironJohnsson/Restoraveis2`; ajuste se o repositório for outro.

### Atenção ao atualizar um banco existente

Na primeira inicialização com a nova versão, a migration `002_codigo_ibge_e_integridade.sql` apaga os registros
gravados com id 0 pelo erro nº 1 e as simulações que ficaram sem nenhum resultado. São dados que já não podiam
ser consultados, mas a operação não tem volta: faça uma cópia de `backend/data/database.sqlite` antes, se quiser
guardá-los.

---

## 6. Organização dos Commits

A revisão foi dividida em commits por assunto, no padrão `tipo(escopo): descrição`:

| Tipo | Conteúdo |
|---|---|
| `chore` | `.gitignore`, `.gitattributes` e exemplos de variáveis de ambiente |
| `build` | dependências do backend e do frontend; Docker Compose, Dockerfiles e Nginx |
| `fix` | camada de banco (ids, PostgreSQL); autenticação e proteção das rotas; correções da interface; scripts de inicialização |
| `refactor` | separação em models, services e utilitários |
| `feat` | critérios, usuários, importação, IBGE; telas novas do frontend |
| `docs` | especificação OpenAPI; README e documentação do projeto |
| `test` | testes unitários e de integração; testes E2E |
| `ci` | workflow do GitHub Actions |
