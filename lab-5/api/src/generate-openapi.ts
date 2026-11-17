// Genereaza openapi.json din definitiile din codul sursa (fara a porni serverul HTTP)
// Comanda: npm run openapi
import { writeFileSync } from 'fs';
import { join } from 'path';
import { buildDocument, createApp } from './app';

async function main() {
  const app = await createApp();
  const doc = buildDocument(app);
  const out = join(__dirname, '..', '..', 'openapi.json');
  writeFileSync(out, JSON.stringify(doc, null, 2) + '\n');
  const ops = Object.values(doc.paths).reduce((n, p: any) => n + Object.keys(p).length, 0);
  console.log(`OpenAPI ${doc.openapi} generat: ${out} (${Object.keys(doc.paths).length} cai, ${ops} operatii)`);
  await app.close();
}
main();
