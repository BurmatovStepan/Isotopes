import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Isotope } from '../isotopes/entities/isotope.entity.js';
import { User } from '../users/entities/user.entity.js';
import { Like } from './entities/like.entity.js';
import { IsotopesController, IsotopesFeedController } from './isotopes.controller.js';
import { IsotopesService } from './isotopes.service.js';

@Module({
    imports: [TypeOrmModule.forFeature([Isotope, Like, User])],
    controllers: [
        IsotopesController,
        IsotopesFeedController,
    ],
    providers: [IsotopesService],
})
export class IsotopesModule { }
