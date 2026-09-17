import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Isotope } from '../isotopes/entities/isotope.entity.js';
import { Like } from './entities/like.entity.js';
import { User } from './entities/user.entity.js';
import {
    IsotopesAddController,
    IsotopesDraftController,
    IsotopesFeedController,
    IsotopesHomeController,
    IsotopePublicationController,
} from './isotopes.controller.js';
import { IsotopesService } from './isotopes.service.js';

@Module({
    imports: [TypeOrmModule.forFeature([Isotope, Like, User])],
    controllers: [
        IsotopesHomeController,
        IsotopesAddController,
        IsotopesFeedController,
        IsotopesDraftController,
        IsotopePublicationController,
    ],
    providers: [IsotopesService],
})
export class IsotopesModule { }
