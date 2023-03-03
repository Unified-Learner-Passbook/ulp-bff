import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  const port = process.env.PORT || 3000;
  await app.listen(3000);
  console.log(`🚀 Application is running on: http://localhost:${port}/`);
}
bootstrap();
