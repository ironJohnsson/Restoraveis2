const app = require('./app');
const config = require('./config/config');
const db = require('./database/db');

async function iniciarServidor() {
  try {
    // Inicializa e verifica o banco de dados
    console.log('[INFO] Inicializando banco de dados relacional...');
    await db.getDb();
    console.log('[SUCESSO] Banco de dados inicializado com migrações e seeds!');

    const server = app.listen(config.port, () => {
      console.log(`=======================================================`);
      console.log(`  PLATAFORMA DE ENERGIA RENOVÁVEL COM TOPSIS (API)`);
      console.log(`  Servidor ouvindo na porta: http://localhost:${config.port}`);
      console.log(`  Documentação Swagger:      http://localhost:${config.port}/api-docs`);
      console.log(`  Health Check:              http://localhost:${config.port}/api/status`);
      console.log(`=======================================================`);
    });

    return server;
  } catch (err) {
    console.error('[ERRO FATAL] Falha ao iniciar servidor:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  iniciarServidor();
}

module.exports = { app, iniciarServidor };
