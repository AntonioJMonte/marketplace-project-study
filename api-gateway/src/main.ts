import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module.js';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(helmet({
      contentSecurityPolicy: { 
        directives: { 
          defaultSrc: ["'self'"], 
          scriptSrc: ["'self'"], 
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:'],
        }
      },
      crossOriginEmbedderPolicy: false, // isola recursos cross origin, precisa que sejam enviados cabeçalhos estilo COEP (false para não quebrar)
      hsts: { // force all browsers to use HTTPS
        maxAge: 315036000,
        includeSubDomains: true,
        preload: true, 
      }
    })
  );

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (error: Error | null, allow?: boolean) => void,
    ) => {

      if (!origin) return callback(null, true);

      const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || ['*'];

      if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        callback(null, true);
      }
      else {
        callback(new Error ('Not allowed by CORS'));
      }

    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: [
      'Content-type', 
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
      'Access-Control-Request-Method',
      'Access-Control-Request-Headers'
    ],
    credentials: true,
    maxAge: 86400, // 24 hours
  })

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    })
  )

  const config = new DocumentBuilder()
    .setTitle('Marketplace API Gateway')
    .setDescription('API Gateway for Marketplace Microservices')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT || 3005;

  await app.listen(port);
  
  console.log(`API Gateway running on port ${port}`);
  console.log(`Swagger documentation: <http://localhost>: ${port}/api`);
  
}
await bootstrap();
