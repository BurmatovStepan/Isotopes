import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from '../auth/auth.module.js';
import { S3StorageModule } from '../storage/storage.module.js';
import { Isotope } from './entities/isotope.entity.js';
import { Like } from './entities/like.entity.js';
import { IsotopeController } from './isotope.controller.js';
import { IsotopeService } from './isotope.service.js';

@Module({
    imports: [
        TypeOrmModule.forFeature([Isotope, Like]),
        S3StorageModule,
        AuthModule,
    ],
    controllers: [
        IsotopeController,
    ],
    providers: [IsotopeService],
})
export class IsotopeModule { }
