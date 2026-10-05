const app = require('./app');
const config = require('./config/config');
const db = require('./database/db');

async function iniciarServidor(porta = config.port) {
  console.log(`[INFO] Inicializando banco de dados (${config.databaseUrl ? 'PostgreSQL' : 'SQLite'})...`);
  await db.init({ log: console.log });
  console.log('[SUCESSO] Banco de dados pronto (migrations e dados iniciais aplicados).');

  return new Promise((resolve) => {
    const server = app.listen(porta, () => {
      const enderecoPorta = server.address().port;
      console.log('=======================================================');
      console.log('  PLATAFORMA DE ENERGIA RENOVÁVEL COM TOPSIS (API)');
      console.log(`  Servidor ouvindo na porta: http://localhost:${enderecoPorta}`);
      console.log(`  Documentação Swagger:      http://localhost:${enderecoPorta}/api-docs`);
      console.log(`  Health Check:              http://localhost:${enderecoPorta}/api/status`);
      console.log('=======================================================');
      resolve(server);
    });
  });
}

/* istanbul ignore next -- ponto de entrada do processo (`npm start`) */
if (require.main === module) {
  iniciarServidor().catch((err) => {
    console.error('[ERRO FATAL] Falha ao iniciar servidor:', err);
    process.exit(1);
  });
}

module.exports = { app, iniciarServidor };
