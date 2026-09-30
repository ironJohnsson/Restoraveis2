const express = require('express');
const cors = require('cors');
const path = require('path');
const swaggerUi = require('swagger-ui-express');

const routes = require('./routes');
const errorHandler = require('./middlewares/errorHandler');
const swaggerDocument = require('./docs/swagger.json');

const app = express();

// Middlewares essenciais
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Documentação Interativa Swagger / OpenAPI (RNF06)
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
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

// Tratamento central de erros
app.use(errorHandler);

module.exports = app;
