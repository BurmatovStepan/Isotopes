import { Controller, Get, NotFoundException, Param, ParseIntPipe, Query, Render } from '@nestjs/common';

import { Isotope, IsotopeStatus } from './entities/isotope.entity.js';
import { IsotopesService, IsotopeView } from './isotopes.service.js';

const CURRENT_USER_ID = 1;

export const MINIO_URL = 'http://localhost:9000/isotopes';

export const MAX_HALF_LIFE = 1_000_000_000_000_000_000_000_000_000n;

const NANOSECONDS_PER_SECOND = 1000000000n;
const SECONDS_PER_YEAR = 31556952n;

const TIME_UNITS = [
    { label: 'млрд. лет', nanoseconds: SECONDS_PER_YEAR * 1000000000n * NANOSECONDS_PER_SECOND },
    { label: 'млн. лет', nanoseconds: SECONDS_PER_YEAR * 1000000n * NANOSECONDS_PER_SECOND },
    { label: 'тыс. лет', nanoseconds: SECONDS_PER_YEAR * 1000n * NANOSECONDS_PER_SECOND },
    { label: 'л.', nanoseconds: SECONDS_PER_YEAR * NANOSECONDS_PER_SECOND },
    { label: 'д.', nanoseconds: 86400n * NANOSECONDS_PER_SECOND },
    { label: 'ч.', nanoseconds: 3600n * NANOSECONDS_PER_SECOND },
    { label: 'мин.', nanoseconds: 60n * NANOSECONDS_PER_SECOND },
    { label: 'сек.', nanoseconds: NANOSECONDS_PER_SECOND },
    { label: 'мс.', nanoseconds: 1000000n },
    { label: 'мкс.', nanoseconds: 1000n },
    { label: 'нс.', nanoseconds: 1n },
];

function formatHalfLife(nanoseconds: bigint) {
    if (nanoseconds === 0n) {
        return '0 сек.';
    }

    const matchedUnit = TIME_UNITS.find(unit => nanoseconds >= unit.nanoseconds);

    if (!matchedUnit) {
        return `${nanoseconds.toString()} нс.`
    }

    const integerPart = nanoseconds / matchedUnit.nanoseconds;
    const remainder = nanoseconds % matchedUnit.nanoseconds;
    const fractionalPart = (remainder * 100n) / matchedUnit.nanoseconds;

    if (fractionalPart === 0n) {
        return `${integerPart} ${matchedUnit.label}`;
    }


    const fractionString = fractionalPart.toString().padStart(2, '0').replace(/0+$/, '');
    return `${integerPart}.${fractionString} ${matchedUnit.label}`;
}

function formatIsotope(isotope: Isotope) {
    return {
        ...isotope,

        radiationTypeClass:
            `isotope__radiation-type${isotope.isAlpha
                ? ' isotope__radiation-type--alpha'
                : ''
            }`,

        radiationTypeValue: isotope.isAlpha ? 'Есть' : 'Нет',

        halfLifeFormatted:
            isotope.halfLife !== null
                ? formatHalfLife(isotope.halfLife)
                : 'неизвестно',

        fullVideoUrl: isotope.videoUrl
            ? `${MINIO_URL}/${isotope.videoUrl}`
            : null,

        fullImageUrl: isotope.imageUrl
            ? `${MINIO_URL}/${isotope.imageUrl}`
            : null,
    };
}

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

        return {
            ...formatIsotope(isotopeView.isotope),
            likeCount: isotopeView.likeCount,
            isLiked: isotopeView.isLiked,
        }
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

        return {
            ...formatIsotope(isotopeView.isotope),
            likeCount: isotopeView.likeCount,
            isLiked: isotopeView.isLiked,
        }
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

// @Controller('isotopes/feed')
// export class IsotopesFeedController {
//     @Get()
//     @Render('feed')
//     fetchFeed(@Query('maxHalfLifeExponent') maxHalfLifeExponent?: string) {
//         let publishedList = ISOTOPE.filter(isotope => isotope.status === IsotopeStatus.Published);

//         let limit = undefined;

//         if (maxHalfLifeExponent && maxHalfLifeExponent !== "-1") {
//             limit = 10n ** BigInt(maxHalfLifeExponent);
//         }

//         if (limit !== undefined) {
//             publishedList = publishedList.filter(isotope => isotope.halfLife <= limit);
//         }

//         return {
//             isotopes: publishedList.map(formatIsotope),
//             maxHalfLifeExponent: maxHalfLifeExponent || '-1',
//         }
//     }
// }
