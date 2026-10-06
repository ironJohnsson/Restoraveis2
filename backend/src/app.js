const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');

const config = require('./config/config');
const routes = require('./routes');
const errorHandler = require('./middlewares/errorHandler');
const openapi = require('./docs/openapi');

const app = express();

app.disable('x-powered-by');
// Atrás do proxy reverso (Nginx), TRUST_PROXY=1 faz o limite de tentativas de login usar o IP real do cliente
if (config.trustProxy) {
  app.set('trust proxy', config.trustProxy);
}

// O frontend acessa a API pelo mesmo domínio (proxy); CORS libera apenas as origens configuradas
app.use(cors({
  origin: config.corsOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Documentação Interativa Swagger / OpenAPI (RNF06)
app.get('/api-docs.json', (req, res) => res.status(200).json(openapi));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openapi, {
  customSiteTitle: 'Documentação API TOPSIS — Energia Renovável'
}));

// Roteador Principal da API
app.use('/api', routes);

// Rota raiz informativa
app.get('/', (req, res) => {
  res.status(200).json({
    projeto: 'Plataforma de Energia Renovável com TOPSIS',
    status: 'online',
    documentacao: '/api-docs',
    endpoints: '/api/status'
  });
});

app.use((req, res) => {
  res.status(404).json({ sucesso: false, mensagem: `Rota não encontrada: ${req.method} ${req.originalUrl}` });
});

// Tratamento central de erros
app.use(errorHandler);

module.exports = app;
