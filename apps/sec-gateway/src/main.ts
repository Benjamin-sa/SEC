/**
 * SEC Gateway Service
 * Main entry point for the SEC EDGAR API Gateway
 */

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Set global prefix
  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);
  
  // Enable CORS if needed
  app.enableCors();
  
  const port = process.env.PORT || 3000;
  await app.listen(port);
  
  Logger.log(
    `🚀 SEC Gateway Service is running on: http://localhost:${port}/${globalPrefix}`
  );
  Logger.log(`📊 Rate limiting: 10 requests per second (SEC compliance)`);
  Logger.log(`💾 Caching: Redis enabled for performance optimization`);
}

bootstrap();
