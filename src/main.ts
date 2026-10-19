import cookieParser from 'cookie-parser';
import { join } from 'path';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';

import { AppModule } from './app.module.js';

async function bootstrap() {
    const app = await NestFactory.create<NestExpressApplication>(
        AppModule,
    );

    app.use(cookieParser());

    app.setGlobalPrefix('api');

    app.useGlobalPipes(
        new ValidationPipe({
            transform: true,
            whitelist: true,
            forbidNonWhitelisted: true,
        }),
    );
    app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

    app.useStaticAssets(join(import.meta.dirname, '..', 'public'));

    const swaggerConfig = new DocumentBuilder()
        .setTitle('Isotopes API')
        .setDescription(
            'Бэкенд SPA для работы с изотопами: аутентификация, черновики, публикации, лента и лайки',
        )
        .addCookieAuth('session')
        .build();

    const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, swaggerDocument);

    await app.listen(3000);
}
bootstrap();
