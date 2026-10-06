/**
 * Especificação OpenAPI 3.0 da API (RNF06).
 * Servida em /api-docs (Swagger UI) e /api-docs.json; `npm run docs:api` exporta
 * uma cópia para docs/api/openapi.json. O teste tests/integration/openapi.test.js
 * garante que toda rota do Express está documentada aqui.
 */
const ref = nome => ({ $ref: `#/components/schemas/${nome}` });
const json = schema => ({ 'application/json': { schema } });

const erro = descricao => ({ description: descricao, content: json(ref('Erro')) });
const naoAutenticado = erro('Token ausente, inválido ou expirado');
const semPermissao = erro('Perfil sem permissão para a operação');
const naoEncontrado = erro('Registro não encontrado');
const invalido = erro('Dados inválidos');

const ok = (descricao, schema) => ({ description: descricao, content: json(schema) });
const mensagem = descricao => ok(descricao, ref('Mensagem'));

const idPath = { name: 'id', in: 'path', required: true, schema: { type: 'integer', minimum: 1 } };

/** Operação autenticada: acrescenta as respostas 401/403 e o esquema de segurança. */
function protegida(operacao, { perfis } = {}) {
  return {
    ...operacao,
    description: [operacao.description, perfis ? `**Perfis autorizados:** ${perfis.join(', ')}.` : '**Perfis autorizados:** qualquer usuário autenticado.']
      .filter(Boolean).join('\n\n'),
    security: [{ bearerAuth: [] }],
    responses: {
      ...operacao.responses,
      401: naoAutenticado,
      ...(perfis ? { 403: semPermissao } : {})
    }
  };
}

const simulacaoGet = {
  tags: ['Simulações'],
  summary: 'Obter o resultado completo de uma simulação salva',
  parameters: [idPath],
  responses: {
    200: ok('Simulação no mesmo formato de POST /api/topsis/executar', {
      type: 'object',
      properties: { sucesso: { type: 'boolean' }, dados: ref('ResultadoSimulacao') }
    }),
    404: naoEncontrado
  }
};

const simulacoesList = {
  tags: ['Simulações'],
  summary: 'Histórico de simulações TOPSIS (RF10)',
  parameters: [{ name: 'limite', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 500 } }],
  responses: {
    200: ok('Simulações, da mais recente para a mais antiga', {
      type: 'object',
      properties: {
        sucesso: { type: 'boolean' },
        total: { type: 'integer' },
        dados: { type: 'array', items: ref('SimulacaoResumo') }
      }
    })
  }
};

module.exports = {
  openapi: '3.0.3',
  info: {
    title: 'Plataforma de Energia Renovável com TOPSIS — API',
    version: '1.1.0',
    description:
      'API RESTful para mensuração multicritério de vulnerabilidade social energética (ODS 7) com o método TOPSIS.\n\n' +
      'Autentique-se em **POST /api/auth/login** e informe o token no botão **Authorize** (esquema Bearer).',
    license: { name: 'MIT' }
  },
  servers: [{ url: '/', description: 'Servidor atual' }],
  tags: [
    { name: 'Sistema' },
    { name: 'Autenticação' },
    { name: 'Usuários', description: 'RF08 — usuários e perfis de acesso' },
    { name: 'Municípios', description: 'RF01 — alternativas e matriz de decisão' },
    { name: 'Critérios', description: 'RF02/RF03 — critérios e pesos' },
    { name: 'TOPSIS', description: 'RF04 — execução do cálculo' },
    { name: 'Simulações', description: 'RF10 — histórico' },
    { name: 'Relatórios', description: 'RF06 — exportação PDF/CSV' },
    { name: 'Importação', description: 'RF09 — fontes externas (CSV, IBGE, ViaCEP)' }
  ],
  paths: {
    '/api/status': {
      get: {
        tags: ['Sistema'],
        summary: 'Verificação de saúde da API (pública)',
        responses: {
          200: ok('API online', {
            type: 'object',
            properties: {
              status: { type: 'string', example: 'online' },
              plataforma: { type: 'string' },
              versao: { type: 'string' },
              normas: { type: 'array', items: { type: 'string' } },
              timestamp: { type: 'string', format: 'date-time' }
            }
          })
        }
      }
    },

    '/api/auth/login': {
      post: {
        tags: ['Autenticação'],
        summary: 'Autenticar e obter o token JWT (pública)',
        requestBody: {
          required: true,
          content: json({
            type: 'object',
            required: ['email', 'senha'],
            properties: {
              email: { type: 'string', format: 'email', example: 'admin@topsis.gov.br' },
              senha: { type: 'string', example: '123456' }
            }
          })
        },
        responses: {
          200: ok('Login realizado', {
            type: 'object',
            properties: {
              sucesso: { type: 'boolean' },
              mensagem: { type: 'string' },
              token: { type: 'string' },
              usuario: ref('UsuarioToken')
            }
          }),
          400: invalido,
          401: erro('Credenciais inválidas'),
          429: erro('Muitas tentativas de login')
        }
      }
    },
    '/api/auth/me': {
      get: protegida({
        tags: ['Autenticação'],
        summary: 'Dados do usuário autenticado',
        responses: {
          200: ok('Usuário do token', { type: 'object', properties: { sucesso: { type: 'boolean' }, usuario: ref('Usuario') } })
        }
      })
    },
    '/api/auth/senha': {
      put: protegida({
        tags: ['Autenticação'],
        summary: 'Alterar a própria senha',
        requestBody: {
          required: true,
          content: json({
            type: 'object',
            required: ['senhaAtual', 'novaSenha'],
            properties: { senhaAtual: { type: 'string' }, novaSenha: { type: 'string', minLength: 8 } }
          })
        },
        responses: { 200: mensagem('Senha alterada'), 400: invalido }
      })
    },

    '/api/usuarios': {
      get: protegida({
        tags: ['Usuários'],
        summary: 'Listar usuários',
        responses: {
          200: ok('Usuários cadastrados', {
            type: 'object',
            properties: { sucesso: { type: 'boolean' }, total: { type: 'integer' }, dados: { type: 'array', items: ref('Usuario') } }
          })
        }
      }, { perfis: ['admin'] }),
      post: protegida({
        tags: ['Usuários'],
        summary: 'Cadastrar usuário',
        requestBody: { required: true, content: json(ref('UsuarioEntrada')) },
        responses: {
          201: ok('Usuário criado', {
            type: 'object',
            properties: { sucesso: { type: 'boolean' }, mensagem: { type: 'string' }, usuarioId: { type: 'integer' } }
          }),
          400: invalido,
          409: erro('E-mail já cadastrado')
        }
      }, { perfis: ['admin'] })
    },
    '/api/usuarios/{id}': {
      put: protegida({
        tags: ['Usuários'],
        summary: 'Atualizar nome, e-mail, perfil ou redefinir a senha de um usuário',
        parameters: [idPath],
        requestBody: { required: true, content: json(ref('UsuarioEntrada')) },
        responses: { 200: mensagem('Usuário atualizado'), 400: invalido, 404: naoEncontrado, 409: erro('Conflito (e-mail em uso ou único administrador)') }
      }, { perfis: ['admin'] }),
      delete: protegida({
        tags: ['Usuários'],
        summary: 'Excluir usuário',
        parameters: [idPath],
        responses: { 200: mensagem('Usuário removido'), 404: naoEncontrado, 409: erro('Não é possível excluir a própria conta nem o único administrador') }
      }, { perfis: ['admin'] })
    },

    '/api/municipios': {
      get: protegida({
        tags: ['Municípios'],
        summary: 'Listar municípios com indicadores',
        parameters: [
          { name: 'uf', in: 'query', schema: { type: 'string', example: 'BA' } },
          { name: 'busca', in: 'query', description: 'Trecho do nome ou da UF', schema: { type: 'string' } }
        ],
        responses: {
          200: ok('Municípios', {
            type: 'object',
            properties: { sucesso: { type: 'boolean' }, total: { type: 'integer' }, dados: { type: 'array', items: ref('Municipio') } }
          }),
          400: invalido
        }
      }),
      post: protegida({
        tags: ['Municípios'],
        summary: 'Cadastrar município (UC01)',
        requestBody: { required: true, content: json(ref('MunicipioEntrada')) },
        responses: {
          201: ok('Município criado', {
            type: 'object',
            properties: { sucesso: { type: 'boolean' }, mensagem: { type: 'string' }, municipioId: { type: 'integer' } }
          }),
          400: invalido,
          409: erro('Município (nome + UF) ou código IBGE já cadastrado')
        }
      }, { perfis: ['admin'] })
    },
    '/api/municipios/{id}': {
      get: protegida({
        tags: ['Municípios'],
        summary: 'Obter município por id',
        parameters: [idPath],
        responses: {
          200: ok('Município', { type: 'object', properties: { sucesso: { type: 'boolean' }, dados: ref('Municipio') } }),
          404: naoEncontrado
        }
      }),
      put: protegida({
        tags: ['Municípios'],
        summary: 'Atualizar município (parcial)',
        description: 'Apenas os campos enviados são alterados. Em `indicadores`, o valor `null` remove o dado do critério.',
        parameters: [idPath],
        requestBody: { required: true, content: json(ref('MunicipioEntrada')) },
        responses: { 200: mensagem('Município atualizado'), 400: invalido, 404: naoEncontrado, 409: erro('Nome + UF ou código IBGE em uso') }
      }, { perfis: ['admin'] }),
      delete: protegida({
        tags: ['Municípios'],
        summary: 'Excluir município',
        parameters: [idPath],
        responses: { 200: mensagem('Município removido'), 404: naoEncontrado }
      }, { perfis: ['admin'] })
    },

    '/api/criterios': {
      get: protegida({
        tags: ['Critérios'],
        summary: 'Listar critérios e pesos padrão',
        responses: {
          200: ok('Critérios', {
            type: 'object',
            properties: {
              sucesso: { type: 'boolean' },
              total: { type: 'integer' },
              somaPesos: { type: 'number', example: 1 },
              dados: { type: 'array', items: ref('Criterio') }
            }
          })
        }
      }),
      post: protegida({
        tags: ['Critérios'],
        summary: 'Cadastrar critério (entra com peso 0)',
        requestBody: { required: true, content: json(ref('CriterioEntrada')) },
        responses: {
          201: ok('Critério criado', {
            type: 'object',
            properties: { sucesso: { type: 'boolean' }, mensagem: { type: 'string' }, criterioId: { type: 'integer' }, codigo: { type: 'string' } }
          }),
          400: invalido,
          409: erro('Código já utilizado')
        }
      }, { perfis: ['admin', 'pesquisador'] })
    },
    '/api/criterios/pesos': {
      put: protegida({
        tags: ['Critérios'],
        summary: 'Atualizar os pesos padrão (a soma de todos os critérios deve ser 1)',
        requestBody: {
          required: true,
          content: json({
            type: 'object',
            required: ['pesos'],
            properties: {
              pesos: {
                type: 'object',
                additionalProperties: { type: 'number', minimum: 0, maximum: 1 },
                example: { C1: 0.2, C2: 0.2, C3: 0.15, C4: 0.25, C5: 0.2, C6: 0, C7: 0 }
              }
            }
          })
        },
        responses: {
          200: ok('Pesos atualizados', {
            type: 'object',
            properties: { sucesso: { type: 'boolean' }, mensagem: { type: 'string' }, dados: { type: 'array', items: ref('Criterio') } }
          }),
          400: erro('Peso fora de 0..1, critério inexistente ou soma diferente de 1')
        }
      }, { perfis: ['admin', 'pesquisador'] })
    },
    '/api/criterios/{id}': {
      put: protegida({
        tags: ['Critérios'],
        summary: 'Atualizar nome, descrição, tipo, unidade ou fonte',
        parameters: [idPath],
        requestBody: { required: true, content: json(ref('CriterioEntrada')) },
        responses: { 200: mensagem('Critério atualizado'), 400: invalido, 404: naoEncontrado }
      }, { perfis: ['admin', 'pesquisador'] }),
      delete: protegida({
        tags: ['Critérios'],
        summary: 'Excluir critério',
        description: 'Remove também os valores do critério na matriz de decisão e redistribui o seu peso entre os demais.',
        parameters: [idPath],
        responses: { 200: mensagem('Critério removido'), 404: naoEncontrado, 409: erro('Único critério cadastrado') }
      }, { perfis: ['admin', 'pesquisador'] })
    },

    '/api/topsis/executar': {
      post: protegida({
        tags: ['TOPSIS'],
        summary: 'Executar o cálculo TOPSIS e gerar o ranking (UC03)',
        description:
          'Monta a matriz de decisão com os valores vigentes, normaliza (norma vetorial), pondera, calcula A+, A-, ' +
          'as distâncias euclidianas e o coeficiente de proximidade Ci.\n\n' +
          'Municípios sem valor em algum critério com peso maior que zero não entram no cálculo e são devolvidos em `alternativasExcluidas`.',
        requestBody: {
          content: json({
            type: 'object',
            properties: {
              titulo: { type: 'string', example: 'Cenário foco social' },
              municipioIds: { type: 'array', items: { type: 'integer' }, description: 'Vazio ou ausente = todos' },
              criteriosIds: {
                type: 'array',
                items: { oneOf: [{ type: 'integer' }, { type: 'string' }] },
                description: 'Ids ou códigos (ex.: "C1"). Vazio ou ausente = todos'
              },
              pesosPersonalizados: {
                type: 'object',
                additionalProperties: { type: 'number', minimum: 0 },
                description: 'Pesos por código; são normalizados para somar 1. Ausente = pesos padrão',
                example: { C1: 0.2, C2: 0.2, C3: 0.15, C4: 0.25, C5: 0.2 }
              },
              salvarSimulacao: { type: 'boolean', default: true }
            }
          })
        },
        responses: {
          200: ok('Ranking calculado', ref('ResultadoSimulacao')),
          400: erro('Parâmetros inválidos ou menos de 2 alternativas com dados completos')
        }
      })
    },
    '/api/simulacoes': { get: protegida(simulacoesList) },
    '/api/simulacoes/{id}': { get: protegida(simulacaoGet) },
    '/api/topsis/simulacoes': {
      get: protegida({ ...simulacoesList, deprecated: true, summary: 'Histórico de simulações (use /api/simulacoes)' })
    },
    '/api/topsis/simulacoes/{id}': {
      get: protegida({ ...simulacaoGet, deprecated: true, summary: 'Obter simulação (use /api/simulacoes/{id})' })
    },

    '/api/relatorios/{id}/csv': {
      get: protegida({
        tags: ['Relatórios'],
        summary: 'Exportar o ranking da simulação em CSV',
        description: 'Separador `;`, vírgula decimal e BOM UTF-8 (compatível com Excel em pt-BR).',
        parameters: [idPath],
        responses: {
          200: { description: 'Arquivo CSV', content: { 'text/csv': { schema: { type: 'string' } } } },
          404: naoEncontrado
        }
      })
    },
    '/api/relatorios/{id}/pdf': {
      get: protegida({
        tags: ['Relatórios'],
        summary: 'Exportar o relatório executivo da simulação em PDF',
        parameters: [idPath],
        responses: {
          200: { description: 'Arquivo PDF', content: { 'application/pdf': { schema: { type: 'string', format: 'binary' } } } },
          404: naoEncontrado
        }
      })
    },

    '/api/importacao/modelo.csv': {
      get: protegida({
        tags: ['Importação'],
        summary: 'Baixar o modelo de planilha para importação',
        responses: { 200: { description: 'Modelo CSV', content: { 'text/csv': { schema: { type: 'string' } } } } }
      }, { perfis: ['admin'] })
    },
    '/api/importacao/municipios': {
      post: protegida({
        tags: ['Importação'],
        summary: 'Importar municípios e indicadores de um CSV',
        description:
          'Colunas: `nome`, `uf` (obrigatórias), `codigo_ibge`, `populacao`, `idh`, `latitude`, `longitude` e uma coluna por ' +
          'critério (`C1`, `C2`...). Municípios existentes (mesmo código IBGE ou nome + UF) são atualizados; células vazias não alteram o valor atual.',
        parameters: [{ name: 'anoReferencia', in: 'query', schema: { type: 'integer', example: 2024 } }],
        requestBody: {
          required: true,
          content: {
            'text/csv': { schema: { type: 'string', example: 'nome;uf;latitude;longitude;C1\nIrecê;BA;-11,3094;-41,839;4,2' } },
            'application/json': { schema: { type: 'object', required: ['csv'], properties: { csv: { type: 'string' } } } }
          }
        },
        responses: {
          200: ok('Resultado da importação', {
            type: 'object',
            properties: {
              sucesso: { type: 'boolean' },
              mensagem: { type: 'string' },
              total: { type: 'integer' },
              criados: { type: 'integer' },
              atualizados: { type: 'integer' },
              erros: {
                type: 'array',
                items: { type: 'object', properties: { linha: { type: 'integer' }, mensagem: { type: 'string' } } }
              },
              colunasIgnoradas: { type: 'array', items: { type: 'string' } }
            }
          }),
          400: erro('Arquivo vazio, sem cabeçalho obrigatório ou acima do limite de linhas')
        }
      }, { perfis: ['admin'] })
    },
    '/api/importacao/ibge/municipios': {
      get: protegida({
        tags: ['Importação'],
        summary: 'Pesquisar municípios na API de Localidades do IBGE',
        parameters: [
          { name: 'uf', in: 'query', required: true, schema: { type: 'string', example: 'BA' } },
          { name: 'nome', in: 'query', required: true, schema: { type: 'string', minLength: 2, example: 'irec' } }
        ],
        responses: {
          200: ok('Até 20 municípios', {
            type: 'object',
            properties: {
              sucesso: { type: 'boolean' },
              total: { type: 'integer' },
              dados: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: { codigoIbge: { type: 'string' }, nome: { type: 'string' }, uf: { type: 'string' } }
                }
              }
            }
          }),
          400: invalido,
          502: erro('Serviço do IBGE indisponível')
        }
      }, { perfis: ['admin'] })
    },
    '/api/importacao/ibge/municipios/{codigo}': {
      get: protegida({
        tags: ['Importação'],
        summary: 'Dados do IBGE de um município (nome, UF, população do Censo 2022 e centroide)',
        parameters: [{ name: 'codigo', in: 'path', required: true, schema: { type: 'string', pattern: '^\\d{7}$', example: '2927408' } }],
        responses: {
          200: ok('Dados do município', { type: 'object', properties: { sucesso: { type: 'boolean' }, dados: ref('MunicipioIbge') } }),
          400: invalido,
          404: naoEncontrado,
          502: erro('Serviço do IBGE indisponível')
        }
      }, { perfis: ['admin'] })
    },
    '/api/importacao/cep/{cep}': {
      get: protegida({
        tags: ['Importação'],
        summary: 'Localizar o município de um CEP (ViaCEP) e devolver seus dados do IBGE',
        parameters: [{ name: 'cep', in: 'path', required: true, schema: { type: 'string', example: '40020000' } }],
        responses: {
          200: ok('Dados do município', { type: 'object', properties: { sucesso: { type: 'boolean' }, dados: ref('MunicipioIbge') } }),
          400: invalido,
          404: naoEncontrado,
          502: erro('Serviço externo indisponível')
        }
      }, { perfis: ['admin'] })
    }
  },
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }
    },
    schemas: {
      Erro: {
        type: 'object',
        properties: {
          sucesso: { type: 'boolean', example: false },
          mensagem: { type: 'string' },
          detalhes: { type: 'object', nullable: true }
        }
      },
      Mensagem: {
        type: 'object',
        properties: { sucesso: { type: 'boolean', example: true }, mensagem: { type: 'string' } }
      },
      UsuarioToken: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          nome: { type: 'string' },
          email: { type: 'string' },
          perfil: { type: 'string', enum: ['admin', 'pesquisador', 'gestor'] }
        }
      },
      Usuario: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          nome: { type: 'string' },
          email: { type: 'string' },
          perfil: { type: 'string', enum: ['admin', 'pesquisador', 'gestor'] },
          created_at: { type: 'string', format: 'date-time' }
        }
      },
      UsuarioEntrada: {
        type: 'object',
        properties: {
          nome: { type: 'string', maxLength: 150 },
          email: { type: 'string', format: 'email' },
          senha: { type: 'string', minLength: 8, description: 'Obrigatória no cadastro; na atualização, redefine a senha' },
          perfil: { type: 'string', enum: ['admin', 'pesquisador', 'gestor'], default: 'pesquisador' }
        }
      },
      Criterio: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          codigo: { type: 'string', example: 'C1' },
          nome: { type: 'string' },
          descricao: { type: 'string', nullable: true },
          tipo: { type: 'string', enum: ['beneficio', 'custo'] },
          peso: { type: 'number', minimum: 0, maximum: 1 },
          unidade: { type: 'string', nullable: true },
          fonte: { type: 'string', nullable: true }
        }
      },
      CriterioEntrada: {
        type: 'object',
        properties: {
          codigo: { type: 'string', description: 'Opcional no cadastro (gerado como C8, C9...); não pode ser alterado depois' },
          nome: { type: 'string', maxLength: 150 },
          descricao: { type: 'string' },
          tipo: { type: 'string', enum: ['beneficio', 'custo'] },
          unidade: { type: 'string', maxLength: 50 },
          fonte: { type: 'string', maxLength: 100 }
        }
      },
      Municipio: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          nome: { type: 'string' },
          uf: { type: 'string', example: 'BA' },
          codigo_ibge: { type: 'string', nullable: true, example: '2927408' },
          populacao: { type: 'integer', nullable: true },
          idh: { type: 'number', nullable: true },
          latitude: { type: 'number' },
          longitude: { type: 'number' },
          created_at: { type: 'string', format: 'date-time' },
          indicadores: { type: 'object', additionalProperties: { type: 'number' }, example: { C1: 1.8, C2: 1.45 } },
          indicadoresDetalhe: { type: 'array', items: { type: 'object' } }
        }
      },
      MunicipioEntrada: {
        type: 'object',
        properties: {
          nome: { type: 'string', maxLength: 200 },
          uf: { type: 'string', example: 'BA' },
          codigoIbge: { type: 'string', pattern: '^\\d{7}$' },
          populacao: { type: 'integer', minimum: 0 },
          idh: { type: 'number', minimum: 0, maximum: 1 },
          latitude: { type: 'number', minimum: -90, maximum: 90 },
          longitude: { type: 'number', minimum: -180, maximum: 180 },
          indicadores: {
            type: 'object',
            additionalProperties: { type: 'number', minimum: 0, nullable: true },
            example: { C1: 5, C2: 2, C3: 1200, C4: 0.75, C5: 5.5 }
          },
          anoReferencia: { type: 'integer', example: 2024 }
        }
      },
      MunicipioIbge: {
        type: 'object',
        properties: {
          codigoIbge: { type: 'string' },
          nome: { type: 'string' },
          uf: { type: 'string' },
          populacao: { type: 'integer', nullable: true },
          latitude: { type: 'number', nullable: true },
          longitude: { type: 'number', nullable: true },
          fonte: { type: 'string' }
        }
      },
      ItemRanking: {
        type: 'object',
        properties: {
          posicao: { type: 'integer' },
          municipioId: { type: 'integer' },
          nome: { type: 'string' },
          uf: { type: 'string' },
          codigoIbge: { type: 'string', nullable: true },
          populacao: { type: 'integer', nullable: true },
          idh: { type: 'number', nullable: true },
          latitude: { type: 'number' },
          longitude: { type: 'number' },
          ci: { type: 'number', description: 'Coeficiente de proximidade (0 a 1); maior = menos vulnerável' },
          distanciaPositiva: { type: 'number' },
          distanciaNegativa: { type: 'number' },
          nivelVulnerabilidade: { type: 'string', example: 'Média Vulnerabilidade' },
          corVulnerabilidade: { type: 'string', example: '#eab308' },
          valoresOriginais: { type: 'array', nullable: true, items: { type: 'number', nullable: true } }
        }
      },
      ResultadoSimulacao: {
        type: 'object',
        properties: {
          sucesso: { type: 'boolean' },
          simulacaoId: { type: 'integer', nullable: true, description: 'null quando salvarSimulacao = false' },
          titulo: { type: 'string' },
          dataExecucao: { type: 'string', format: 'date-time' },
          usuarioNome: { type: 'string', nullable: true },
          totalAlternativas: { type: 'integer' },
          totalCriterios: { type: 'integer' },
          pesosUtilizados: { type: 'array', items: { type: 'number' } },
          criteriosInfo: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'integer' },
                codigo: { type: 'string' },
                nome: { type: 'string' },
                tipo: { type: 'string' },
                unidade: { type: 'string', nullable: true },
                peso: { type: 'number' },
                norma: { type: 'number' },
                aPlus: { type: 'number' },
                aMinus: { type: 'number' }
              }
            }
          },
          ranking: { type: 'array', items: ref('ItemRanking') },
          resumoEstatistico: {
            type: 'object',
            properties: {
              ciMaximo: { type: 'number' },
              ciMinimo: { type: 'number' },
              ciMedio: { type: 'number' },
              municipioMaisVulneravel: { type: 'string' },
              municipioMenosVulneravel: { type: 'string' }
            }
          },
          alternativasExcluidas: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                municipioId: { type: 'integer' },
                nome: { type: 'string' },
                uf: { type: 'string' },
                criteriosSemDado: { type: 'array', items: { type: 'string' } }
              }
            }
          },
          tempoCalculoMs: { type: 'number', nullable: true, description: 'Somente o algoritmo TOPSIS' },
          tempoExecucaoMs: { type: 'number', nullable: true, description: 'Tempo total no servidor (RNF01)' }
        }
      },
      SimulacaoResumo: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          titulo: { type: 'string' },
          data_execucao: { type: 'string', format: 'date-time' },
          status: { type: 'string' },
          usuario_nome: { type: 'string', nullable: true },
          total_municipios: { type: 'integer' },
          melhor_classificado: { type: 'string', nullable: true },
          parametros: { type: 'object' }
        }
      }
    }
  }
};
