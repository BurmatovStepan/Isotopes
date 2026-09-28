import hbs from 'hbs';
import { join } from 'path';

import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';

import { AppModule } from './app.module.js';

async function bootstrap() {
    const app = await NestFactory.create<NestExpressApplication>(
        AppModule,
    );

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

    app.setViewEngine('hbs');
    app.setBaseViewsDir(join(import.meta.dirname, '..', 'views'));
    hbs.registerPartials(join(import.meta.dirname, '..', 'snippets'));

    registerHandlebarsHelpers();

    await app.listen(3000);
}
bootstrap();


function registerHandlebarsHelpers(): void {
    hbs.registerHelper('hash', (options: Handlebars.HelperOptions) => {
        return options.hash;
    });

    hbs.registerHelper('array', (...args: unknown[]) => {
        return args.slice(0, -1);
    });

    hbs.registerHelper('pick', (array: Record<string, unknown>[], key: string) => {
        if (!Array.isArray(array)) {
            return []
        }

        return array.map(item => item[key]);
    });

    hbs.registerHelper('eq', (a: unknown, b: unknown) => {
        return a === b;
    });

    hbs.registerHelper('includes', (array: Array<unknown>, item: unknown) => {
        return array.includes(item);
    });

    hbs.registerHelper('paths', () => [
        { url: '/isotopes/home', imageUrl: '/icons/home.svg' },
        { url: '/isotopes/add', imageUrl: '/icons/circle-plus.svg' },
        { url: '/isotopes/feed', imageUrl: '/icons/grid.svg' },
    ]);

    hbs.registerHelper('choose', (condition: boolean, trueValue: unknown, falseValue: unknown) => {
        return condition ? trueValue : falseValue;
    });
}
