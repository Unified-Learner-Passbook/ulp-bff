import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
const port = process.env.PORT || 3000;
const CRED_URL = process.env.CRED_URL;
const DID_URL = process.env.DID_URL;
const SCHEMA_URL = process.env.SCHEMA_URL;
const KEYCLOAK_URL = process.env.KEYCLOAK_URL;
const REGISTRY_URL = process.env.REGISTRY_URL;
const TESTVAR = process.env.TESTVAR;
const KEYCLOAK_CLIENT_ID = process.env.KEYCLOAK_CLIENT_ID;
const KEYCLOAK_CLIENT_SECRET = process.env.KEYCLOAK_CLIENT_SECRET;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  await app.listen(3000);
  console.log('CRED_URL', CRED_URL);
  console.log('DID_URL', DID_URL);
  console.log('SCHEMA_URL', SCHEMA_URL);
  console.log('KEYCLOAK_URL', KEYCLOAK_URL);
  console.log('REGISTRY_URL', REGISTRY_URL);
  console.log('KEYCLOAK_CLIENT_ID', KEYCLOAK_CLIENT_ID);
  console.log('KEYCLOAK_CLIENT_SECRET', KEYCLOAK_CLIENT_SECRET);
  console.log(`🚀 Application is running on: http://localhost:${port}/`);
}
bootstrap();
