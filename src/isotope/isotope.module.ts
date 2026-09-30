import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Isotope } from './entities/isotope.entity.js';
import { Like } from './entities/like.entity.js';
import { AuthService, IsotopeController, IsotopeFeedController } from './isotope.controller.js';
import { IsotopeService } from './isotope.service.js';
import { MinioService } from './storage/storage.service.js';

@Module({
    imports: [TypeOrmModule.forFeature([Isotope, Like])],
    controllers: [
        IsotopeController,
        IsotopeFeedController,
    ],
    providers: [IsotopeService, AuthService, MinioService],
})
export class IsotopeModule { }
