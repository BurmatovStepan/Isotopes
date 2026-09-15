import { Controller, Get, NotFoundException, Param, ParseIntPipe, Query, Render } from '@nestjs/common';

import { IsotopesService } from './isotopes.service.js';

const CURRENT_USER_ID = 1;

export const MINIO_URL = 'http://localhost:9000/isotopes';

@Controller('isotopes/home')
export class IsotopesHomeController {
    constructor(private readonly isotopeService: IsotopesService) { }

    @Get('')
    @Render('home')
    async fetchFirst() {
        const isotopeView = await this.isotopeService.getFirstPublished(CURRENT_USER_ID);

        if (!isotopeView) {
            throw new NotFoundException();
        }

        return isotopeView;
    }

    @Get(':id')
    @Render('home')
    async fetchById(@Param('id', ParseIntPipe) id: number, @Query('next') next?: string) {
        let isotopeView;

        if (next === 'true') {
            isotopeView = await this.isotopeService.getNextPublished(id, CURRENT_USER_ID);
        } else {
            isotopeView = await this.isotopeService.getPublishedById(id, CURRENT_USER_ID);
        }

        if (!isotopeView) {
            isotopeView = await this.isotopeService.getFirstPublished(CURRENT_USER_ID);
        }

        if (!isotopeView) {
            throw new NotFoundException();
        }

        return isotopeView;
    }
}



// @Controller('isotopes/add')
// export class IsotopesAddController {
//     @Get()
//     @Render('add')
//     fetchDraft() {
//         const draftIsotope = ISOTOPE.find(isotope => isotope.status === IsotopeStatus.Draft);
//         if (!draftIsotope) {
//             throw new NotFoundException('Черновик не найден');
//         }

//         return {
//             ...formatIsotope(draftIsotope),
//         }
//     }
// }

@Controller('isotopes/feed')
export class IsotopesFeedController {
    constructor(private readonly isotopeService: IsotopesService) { }

    @Get()
    @Render('feed')
    async fetchFeed(@Query('maxHalfLifeExponent') maxHalfLifeExponent?: string) {
        let limit = undefined;

        if (maxHalfLifeExponent && maxHalfLifeExponent !== "-1") {
            limit = 10n ** BigInt(maxHalfLifeExponent);
        }

        const isotopes = await this.isotopeService.getPublished(limit, CURRENT_USER_ID);

        return {
            isotopes,
            maxHalfLifeExponent: maxHalfLifeExponent || '-1',
        }
    }
}
