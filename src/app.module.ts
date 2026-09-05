import { Module } from '@nestjs/common';

import { IsotopesModule } from './isotopes/isotopes.module.js';

@Module({
    imports: [IsotopesModule],
})
export class AppModule { }
