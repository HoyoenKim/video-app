import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerCustomOptions, SwaggerModule } from '@nestjs/swagger';
import { Logger, ValidationPipe } from '@nestjs/common';
import { WinstonModule, utilities } from 'nest-winston';
import * as winston from 'winston';
import { TransformInterceptor } from './common/interceptor/transfrom.interceptor';
import { ConfigService } from '@nestjs/config';
import * as basicAuth from 'express-basic-auth';
import { SentryInterceptor } from './common/interceptor/sentry.interceptor';
import * as Sentry from '@sentry/node'

async function bootstrap() {
  const port = 3000;
  const app = await NestFactory.create(AppModule, {
    logger: WinstonModule.createLogger({
      transports: [
        new winston.transports.Console({
          level: process.env.STAGE === 'prod' ? 'info' : 'debug',
          format: winston.format.combine(
            winston.format.timestamp(),
            utilities.format.nestLike('Video Upload', { prettyPrint: true }),
          )
        })
      ]
    })
  });

  const configService = app.get(ConfigService);
  const stage = configService.get('STAGE');

  // Swagger
  const SWAGGER_ENVS = ['local', 'dev'];
  //console.log(configService);
  if (SWAGGER_ENVS.includes(stage)) {
    const swaggerUser = configService['internalConfig']['swagger']['user'];
    const swaggerPassword = configService['internalConfig']['swagger']['password'];
    app.use(
      ['/docs', '/docs-json'],
      basicAuth({
        challenge: true,
        users: {
          [swaggerUser]: swaggerPassword,
        },
      }),
    );
    const config = new DocumentBuilder()
      .setTitle('NestJS project')
      .setDescription('NestJS project API description')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const customOptions: SwaggerCustomOptions = {
      swaggerOptions: {
        persistAuthorization: true,
      },
    };
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document, customOptions);
  }

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
    }),
  );

  Sentry.init({
    dsn: configService['internalConfig']['sentry']['dsn'],
  })
  app.useGlobalInterceptors(new SentryInterceptor(), new TransformInterceptor());
  
  await app.listen(port);
  Logger.log(`STAGE: ${process.env.STAGE}`)
  Logger.log(`listening on ${port}`);
  
}
bootstrap();
