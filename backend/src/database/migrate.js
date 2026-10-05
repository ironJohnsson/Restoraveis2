const fs = require('fs');
const path = require('path');

const PASTA_MIGRATIONS = path.join(__dirname, '../../migrations');

/**
 * Aplica, em ordem alfabética, os arquivos .sql de migrations/<dialeto>/ que ainda
 * não constam na tabela `schema_migrations`. Cada arquivo roda em uma transação.
 *
 * Arquivos terminados em `.optional.sql` dependem de recursos que podem não existir
 * no servidor (ex.: extensão PostGIS). Se falharem, apenas geram um aviso e voltam a
 * ser tentados na próxima inicialização.
 */
async function migrar(adapter, { log = () => {} } = {}) {
  await adapter.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      nome VARCHAR(200) PRIMARY KEY,
      aplicada_em VARCHAR(40) NOT NULL
    );
  `);

  const pasta = path.join(PASTA_MIGRATIONS, adapter.dialect);
  const arquivos = fs.readdirSync(pasta).filter(nome => nome.endsWith('.sql')).sort();
  const aplicadas = new Set((await adapter.all('SELECT nome FROM schema_migrations')).map(m => m.nome));

  const executadas = [];
  for (const arquivo of arquivos) {
    if (aplicadas.has(arquivo)) continue;

    const sql = fs.readFileSync(path.join(pasta, arquivo), 'utf8');
    try {
      await adapter.transaction(async (tx) => {
        await tx.exec(sql);
        await tx.run('INSERT INTO schema_migrations (nome, aplicada_em) VALUES (?, ?)', [
          arquivo,
          new Date().toISOString()
        ]);
      });
      executadas.push(arquivo);
      log(`[MIGRATION] ${arquivo} aplicada`);
    } catch (err) {
      if (!arquivo.endsWith('.optional.sql')) {
        throw new Error(`Falha na migration ${arquivo}: ${err.message}`);
      }
      log(`[MIGRATION] ${arquivo} ignorada (recurso opcional indisponível): ${err.message}`);
    }
  }

  return executadas;
}

module.exports = { migrar };

/* istanbul ignore next -- execução via linha de comando: `npm run migrate` */
if (require.main === module) {
  const db = require('./db');
  db.init({ log: console.log })
    .then(() => {
      console.log('[SUCESSO] Banco de dados atualizado.');
      return db.close();
    })
    .catch((err) => {
      console.error('[ERRO] Falha ao migrar o banco:', err.message);
      process.exit(1);
    });
}
