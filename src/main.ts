import hbs from 'hbs';
import { join } from 'path';

import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';

import { AppModule } from './app.module.js';

async function bootstrap() {
    const app = await NestFactory.create<NestExpressApplication>(
        AppModule,
    );

    app.useStaticAssets(join(import.meta.dirname, '..', 'public'));

    app.setBaseViewsDir(join(import.meta.dirname, '..', 'views'));
    app.setViewEngine('hbs');

    hbs.registerPartials(join(import.meta.dirname, '..', 'snippets'));

    hbs.registerHelper('hash', (options: Handlebars.HelperOptions) => {
        return options.hash;
    });

    hbs.registerHelper('array', (...args: unknown[]) => {
        return args.slice(0, -1);
    });

    hbs.registerHelper('pluck', (array: Record<string, unknown>[], key: string) => {
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
        { url: '/home', imageUrl: '/icons/home.svg' },
        { url: '/add', imageUrl: '/icons/circle-plus.svg' },
        { url: '/feed', imageUrl: '/icons/grid.svg' },
    ]);

    await app.listen(3000);
}
bootstrap();
