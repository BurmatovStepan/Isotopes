import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Isotope } from '../isotopes/entities/isotope.entity.js';
import {
    // IsotopesAddController,
    // IsotopesFeedController,
    IsotopesHomeController
} from './isotopes.controller.js';
import { IsotopesService } from './isotopes.service.js';
import { Like } from './entities/like.entity.js';
import { User } from './entities/user.entity.js';

@Module({
    imports: [TypeOrmModule.forFeature([Isotope, Like, User])],
    controllers: [IsotopesHomeController,/*  IsotopesAddController, IsotopesFeedController*/] ,
    providers: [IsotopesService],
})
export class IsotopesModule { }
