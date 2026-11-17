// Porneste API-ul local cu Swagger UI la http://localhost:3000/docs (pentru verificare)
import { SwaggerModule } from '@nestjs/swagger';
import { buildDocument, createApp } from './app';

async function main() {
  const app = await createApp();
  SwaggerModule.setup('docs', app, buildDocument(app));
  await app.listen(3000);
  console.log('API: http://localhost:3000/v1, Swagger UI: http://localhost:3000/docs');
}
main();
