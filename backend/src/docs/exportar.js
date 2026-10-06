/* istanbul ignore file -- utilitário de linha de comando: `npm run docs:api` */
const fs = require('fs');
const path = require('path');
const openapi = require('./openapi');

const destino = path.join(__dirname, '../../../docs/api/openapi.json');
fs.mkdirSync(path.dirname(destino), { recursive: true });
fs.writeFileSync(destino, `${JSON.stringify(openapi, null, 2)}\n`);
console.log(`Especificação OpenAPI exportada para ${destino}`);
