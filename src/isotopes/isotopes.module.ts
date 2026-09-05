import { Module } from '@nestjs/common';

import {
    IsotopesAddController,
    IsotopesFeedController,
    IsotopesHomeController
} from './isotopes.controller.js';
import { IsotopesService } from './isotopes.service.js';

@Module({
    controllers: [IsotopesHomeController, IsotopesAddController, IsotopesFeedController],
    providers: [IsotopesService],
})
export class IsotopesModule { }
