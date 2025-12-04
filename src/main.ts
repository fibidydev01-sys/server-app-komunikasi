// src/main.ts

import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import * as os from 'os';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

function getLocalIPs(): string[] {
  const interfaces = os.networkInterfaces();
  const ips: string[] = [];

  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        ips.push(iface.address);
      }
    }
  }

  return ips;
}

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('port') || 8000;
  const frontendPort = 5173;
  const nodeEnv = configService.get<string>('nodeEnv');
  const isProduction = nodeEnv === 'production';

  // Get all local network IPs
  const localIPs = getLocalIPs();

  // Build allowed origins dynamically
  const allowedOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    ...localIPs.map((ip) => `http://${ip}:${frontendPort}`),
  ];

  // Add custom origin from env if provided
  const customOrigin = configService.get<string>('frontendOrigin');
  if (customOrigin && !allowedOrigins.includes(customOrigin)) {
    allowedOrigins.push(customOrigin);
  }

  logger.log('🚀 Starting server...');
  logger.log(`📍 Port: ${port}`);
  logger.log(`🔧 Environment: ${nodeEnv}`);
  logger.log('🌍 Allowed Origins:');
  allowedOrigins.forEach((origin) => logger.log(`   ✓ ${origin}`));

  // Security
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  // ✅ CORS configuration - Stricter in production
  app.enableCors({
    origin: (origin, callback) => {
      // ✅ Only allow no origin in development
      if (!origin) {
        if (!isProduction) {
          return callback(null, true);
        }
        logger.warn('⚠️  Blocked request with no origin in production');
        return callback(new Error('Origin required'));
      }

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        logger.warn(`⚠️  Blocked by CORS: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
    exposedHeaders: ['Set-Cookie'],
  });

  // Cookie Parser
  app.use(cookieParser());

  // ✅ Global Validation Pipes with stricter rules
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      // ✅ Stop the first error
      stopAtFirstError: true,
    }),
  );

  // Global Filters
  app.useGlobalFilters(new HttpExceptionFilter());

  // Global Prefix
  app.setGlobalPrefix('api');

  await app.listen(port, '0.0.0.0');

  logger.log(`\n✅ Server running on:`);
  logger.log(`   - http://localhost:${port}`);
  localIPs.forEach((ip) => {
    logger.log(`   - http://${ip}:${port}`);
  });
  logger.log(`\n✅ API available at:`);
  logger.log(`   - http://localhost:${port}/api`);
  localIPs.forEach((ip) => {
    logger.log(`   - http://${ip}:${port}/api`);
  });
}

bootstrap().catch((err) => {
  const logger = new Logger('Bootstrap');
  logger.error('❌ Failed to start server:', err);
  process.exit(1);
});
