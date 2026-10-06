require('dotenv').config();
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const env = process.env.NODE_ENV || 'development';
const dataDir = process.env.DATA_DIR || path.join(__dirname, '../../data');

/**
 * O segredo do JWT nunca fica fixo no código. Ordem de resolução:
 * 1. variável de ambiente JWT_SECRET;
 * 2. arquivo data/.jwt_secret, gerado aleatoriamente na primeira execução.
 */
function resolverJwtSecret() {
  if (process.env.JWT_SECRET) {
    return process.env.JWT_SECRET;
  }
  if (env === 'test') {
    return 'segredo-usado-apenas-nos-testes-automatizados';
  }

  const arquivo = path.join(dataDir, '.jwt_secret');
  if (fs.existsSync(arquivo)) {
    const salvo = fs.readFileSync(arquivo, 'utf8').trim();
    if (salvo) return salvo;
  }

  const segredo = crypto.randomBytes(48).toString('hex');
  fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(arquivo, segredo, { mode: 0o600 });
  return segredo;
}

module.exports = {
  env,
  port: process.env.PORT || 5000,
  trustProxy: Number(process.env.TRUST_PROXY) || 0,
  dataDir,
  jwtSecret: resolverJwtSecret(),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h',
  bcryptRounds: env === 'test' ? 4 : 10,
  // Com DATABASE_URL usa PostgreSQL (+ PostGIS); sem ela, SQLite local (arquivo ou memória)
  databaseUrl: process.env.DATABASE_URL || null,
  dbPath: process.env.DB_PATH || (env === 'test' ? ':memory:' : path.join(dataDir, 'database.sqlite')),
  corsOrigins: (process.env.CORS_ORIGIN || 'http://localhost:3000,http://localhost:5173')
    .split(',')
    .map(origem => origem.trim())
    .filter(Boolean),
  // Ano de referência adotado para os indicadores quando a requisição não informa outro
  anoReferenciaPadrao: 2024,
  ibgeTimeoutMs: Number(process.env.IBGE_TIMEOUT_MS) || 8000
};
