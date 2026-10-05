/**
 * Sobe a API para os testes E2E com um banco SQLite novo em pasta temporária,
 * para que os testes nunca toquem nos dados de desenvolvimento.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');

process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'topsis-e2e-'));
process.env.PORT = process.env.E2E_API_PORT || '5055';
delete process.env.DATABASE_URL;

const { iniciarServidor } = require('../../backend/src/server');

iniciarServidor().catch((err) => {
  console.error('Falha ao iniciar a API para os testes E2E:', err);
  process.exit(1);
});
