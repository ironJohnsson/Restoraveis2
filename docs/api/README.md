# Documentação da API
## Plataforma de Energia Renovável com TOPSIS

A API segue o padrão REST, troca dados em JSON e é descrita em **OpenAPI 3.0** (RNF06).

| Onde | O quê |
|---|---|
| `http://localhost:5000/api-docs` | Swagger UI interativo (com a API no ar) |
| `http://localhost:5000/api-docs.json` | Especificação em JSON servida pela API |
| [openapi.json](openapi.json) | Cópia versionada da especificação (gerada por `cd backend && npm run docs:api`) |
| `backend/src/docs/openapi.js` | Fonte da especificação |

Um teste automatizado (`backend/tests/integration/openapi.test.js`) compara as rotas do Express com a especificação: uma rota nova sem documentação faz o teste falhar.

---

## Autenticação

1. Envie e-mail e senha para `POST /api/auth/login`.
2. Use o `token` devolvido no cabeçalho de todas as outras chamadas: `Authorization: Bearer <token>`.

No Swagger UI, clique em **Authorize** e cole o token.

```bash
# 1. Login
curl -s -X POST http://localhost:5000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"pesquisador@topsis.gov.br","senha":"123456"}'

# 2. Executar o exemplo 7.3 do roteiro (substitua TOKEN e os ids dos municípios A, B e C)
curl -s -X POST http://localhost:5000/api/topsis/executar \
  -H 'Content-Type: application/json' -H 'Authorization: Bearer TOKEN' \
  -d '{"municipioIds":[1,2,3],"criteriosIds":["C1","C2","C3","C4","C5"],
       "pesosPersonalizados":{"C1":0.2,"C2":0.2,"C3":0.15,"C4":0.25,"C5":0.2}}'
```

---

## Endpoints

Perfis: **A** = Administrador, **P** = Pesquisador, **G** = Gestor Público.

| Método | Endpoint | Descrição | Perfis |
|:---:|---|---|:---:|
| GET | `/api/status` | Verificação de saúde | público |
| POST | `/api/auth/login` | Autenticar e obter o token JWT | público |
| GET | `/api/auth/me` | Dados do usuário autenticado | A P G |
| PUT | `/api/auth/senha` | Alterar a própria senha | A P G |
| GET | `/api/municipios` | Listar municípios (filtros `uf`, `busca`) | A P G |
| GET | `/api/municipios/{id}` | Obter município | A P G |
| POST | `/api/municipios` | Criar município | A |
| PUT | `/api/municipios/{id}` | Atualizar município (parcial) | A |
| DELETE | `/api/municipios/{id}` | Excluir município | A |
| GET | `/api/criterios` | Listar critérios e pesos | A P G |
| POST | `/api/criterios` | Criar critério | A P |
| PUT | `/api/criterios/{id}` | Atualizar critério | A P |
| PUT | `/api/criterios/pesos` | Atualizar pesos (soma = 1) | A P |
| DELETE | `/api/criterios/{id}` | Excluir critério | A P |
| POST | `/api/topsis/executar` | Executar cálculo TOPSIS | A P G |
| GET | `/api/simulacoes` | Histórico de simulações | A P G |
| GET | `/api/simulacoes/{id}` | Obter resultado de simulação | A P G |
| GET | `/api/relatorios/{id}/pdf` | Exportar relatório em PDF | A P G |
| GET | `/api/relatorios/{id}/csv` | Exportar relatório em CSV | A P G |
| GET | `/api/usuarios` | Listar usuários | A |
| POST | `/api/usuarios` | Criar usuário | A |
| PUT | `/api/usuarios/{id}` | Atualizar usuário | A |
| DELETE | `/api/usuarios/{id}` | Excluir usuário | A |
| GET | `/api/importacao/modelo.csv` | Modelo de planilha | A |
| POST | `/api/importacao/municipios` | Importar CSV | A |
| GET | `/api/importacao/ibge/municipios` | Pesquisar município no IBGE (`uf`, `nome`) | A |
| GET | `/api/importacao/ibge/municipios/{codigo}` | Dados do IBGE por código | A |
| GET | `/api/importacao/cep/{cep}` | Município de um CEP | A |

Os caminhos `/api/topsis/simulacoes` e `/api/topsis/simulacoes/{id}` continuam aceitos por compatibilidade.

---

## Respostas de erro

Todas as respostas de erro têm o formato `{ "sucesso": false, "mensagem": "..." }`.

| Código | Significado |
|:---:|---|
| 400 | Dados inválidos (a mensagem indica o campo) |
| 401 | Token ausente, inválido ou expirado; credenciais inválidas no login |
| 403 | Perfil sem permissão para a operação |
| 404 | Registro não encontrado |
| 409 | Conflito (município, e-mail ou código já cadastrado) |
| 429 | Muitas tentativas de login |
| 502 | Serviço externo (IBGE/ViaCEP) indisponível |
