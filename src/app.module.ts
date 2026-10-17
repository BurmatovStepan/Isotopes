import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from './auth/auth.module.js';
import { getEnv, parseInteger } from './config.helpers.js';
import { IsotopeModule } from './isotope/isotope.module.js';

@Module({
    imports: [
        IsotopeModule,
        AuthModule,

        ConfigModule.forRoot({
            isGlobal: true,
        }),

        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                type: 'postgres',
                host: getEnv(config, 'DB_HOST', 'localhost'),
                port: getEnv(config, 'DB_PORT', parseInteger, 5432),
                username: getEnv(config, 'DB_USERNAME'),
                password: getEnv(config, 'DB_PASSWORD'),
                database: getEnv(config, 'DB_DATABASE'),
                autoLoadEntities: true,
                synchronize: false,
            }),
        }),

    ],
})
export class AppModule { }
