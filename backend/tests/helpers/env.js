// Executado antes de cada arquivo de teste: banco SQLite em memória, isolado por arquivo.
// Para rodar a mesma suíte contra PostgreSQL: DATABASE_URL=postgres://... npx jest --runInBand
process.env.NODE_ENV = 'test';
if (!process.env.DATABASE_URL) {
  process.env.DB_PATH = ':memory:';
}
