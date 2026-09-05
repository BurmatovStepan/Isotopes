import { Controller, Get, NotFoundException, Param, Query, Render } from '@nestjs/common';

export const MINIO_URL = 'http://localhost:9000/isotopes';

enum IsotopeStatus {
    Draft = 0,
    Published,
    Deleted,
};

interface CreateIsotopeDto {
    name: string;
    halfLife: string;
    note: string;
}

export const USER = [
    { id: 1 },
    { id: 2 }
];

export const ISOTOPE = [
    {
        id: 1,
        name: 'Торий-232',
        halfLife: 443073600000000000,
        note: 'Самый долгоживущий изотоп тория. Применяется в перспективном торий-урановом цикле.',
        videoUrl: '5f1d8212.mp4',
        imageUrl: 'a4a2a11b.jpg',
        status: IsotopeStatus.Published,
        authorId: 1
    },
    {
        id: 2,
        name: 'Калий-40',
        halfLife: 39373200000000000,
        note: '0.012% природного калия. Содержится в продуктах питания и теле человека (~4400 Бк).',
        videoUrl: '7c9e6679.mp4',
        imageUrl: 'd52f6c9d.jpg',
        status: IsotopeStatus.Published,
        authorId: 1
    },
    {
        id: 3,
        name: 'Плутоний-240',
        halfLife: 207070776000,
        note: 'Примесь в оружейном плутонии — спонтанное деление делает его непригодным для орудия взрывного типа.',
        videoUrl: '3b241101.mp4',
        imageUrl: '9a6d0932.png',
        status: IsotopeStatus.Published,
        authorId: 1
    },
    {
        id: 4,
        name: 'Радий-226',
        halfLife: 50492160000,
        note: 'Открыт Марией Кюри в 1898 г. Использовался в светящихся красках (Undark). Источник радона.',
        videoUrl: '0e334a12.mp4',
        imageUrl: '8d7c4b69.jpg',
        status: IsotopeStatus.Published,
        authorId: 1
    },
    {
        id: 5,
        name: 'Актиний-227',
        halfLife: 686940864,
        note: 'Дал название актиниевому ряду. Преимущественно β-распад (98.6%) в Th-227, малая доля α-распада в Fr-223.',
        videoUrl: 'c8e76a14.mp4',
        imageUrl: 'f47ac10b.jpeg',
        status: IsotopeStatus.Draft,
        authorId: 1
    },
    {
        id: 6,
        name: 'Ксенон-133',
        halfLife: 452736,
        note: 'Продукт деления, выброшен при Чернобыльской аварии. Применяется в пульмонологии.',
        videoUrl: '6c905581.mp4',
        imageUrl: '2d9d1502.jpg',
        status: IsotopeStatus.Deleted,
        authorId: 1
    },
    {
        id: 7,
        name: 'Полоний-218',
        halfLife: 186,
        note: 'Первый твёрдый продукт распада радона. Оседает на пыли и поверхностях в помещении, облучает лёгкие.',
        videoUrl: 'e3d7454f.mp4',
        imageUrl: '1b9d6bcd.jpg',
        status: IsotopeStatus.Published,
        authorId: 1
    }
];

export const LIKE = [
    { id: 1, userId: 1, isotopeId: 1 },
    { id: 2, userId: 1, isotopeId: 3 },
    { id: 3, userId: 2, isotopeId: 3 },
    { id: 4, userId: 2, isotopeId: 4 }
];

const SECONDS_PER_YEAR = 31556952;

const TIME_UNITS = [
    { label: 'млрд. лет', seconds: SECONDS_PER_YEAR * 1e9 },
    { label: 'млн. лет', seconds: SECONDS_PER_YEAR * 1e6 },
    { label: 'тыс. лет', seconds: SECONDS_PER_YEAR * 1e3 },
    { label: 'л.', seconds: SECONDS_PER_YEAR },
    { label: 'д.', seconds: 86400 },
    { label: 'ч.', seconds: 3600 },
    { label: 'мин.', seconds: 60 },
    { label: 'сек.', seconds: 1 },
    { label: 'мс.', seconds: 1e-3 },
    { label: 'мкс.', seconds: 1e-6 },
    { label: 'нс.', seconds: 1e-9 },
];

function formatHalfLife(seconds: number) {
    if (seconds === 0) {
        return '0 секунд';
    }

    const matchedUnit = TIME_UNITS.find(unit => seconds >= unit.seconds);

    if (!matchedUnit) {
        return `${seconds.toExponential(2)} сек.`
    }

    const value = seconds / matchedUnit.seconds;

    return `${+value.toFixed(2)} ${matchedUnit.label}`
}

function formatIsotope(isotope: (typeof ISOTOPE)[0]) {
    const likeCount = LIKE.filter(like => like.isotopeId === isotope.id).length;

    return {
        ...isotope,
        likeCount,
        halfLifeFormatted: formatHalfLife(isotope.halfLife),
        fullVideoUrl: `${MINIO_URL}/${isotope.videoUrl}`,
        fullImageUrl: `${MINIO_URL}/${isotope.imageUrl}`,
    };
}

@Controller('home')
export class IsotopesHomeController {
    @Get(['', ':id'])
    @Render('home')
    fetchIsotope(@Param('id') id?: string, @Query('next') next?: string) {
        const publishedList = ISOTOPE.filter(isotope => isotope.status === IsotopeStatus.Published);
        if (publishedList.length === 0) {
            throw new NotFoundException('Нет опубликованных изотопов');
        }

        let targetIndex = 0;

        if (id) {
            const parsedId = +id;
            const foundIndex = publishedList.findIndex(isotope => parsedId === isotope.id);

            targetIndex = foundIndex !== -1 ? foundIndex : 0;
        }

        if (next === 'true') {
            targetIndex = (targetIndex + 1) % publishedList.length
        }

        return {
            ...formatIsotope(publishedList[targetIndex]),
        }
    }
}

@Controller('add')
export class IsotopesAddController {
    @Get()
    @Render('add')
    fetchDraft() {
        const draftIsotope = ISOTOPE.find(isotope => isotope.status === IsotopeStatus.Draft);
        if (!draftIsotope) {
            throw new NotFoundException('Черновик не найден');
        }

        return {
            ...formatIsotope(draftIsotope),
        }
    }
}

@Controller('feed')
export class IsotopesFeedController {
    @Get()
    @Render('feed')
    fetchFeed(@Query('maxHalfLife') maxHalfLife?: string) {
        let publishedList = ISOTOPE.filter(isotope => isotope.status === IsotopeStatus.Published).map(formatIsotope);

        if (maxHalfLife) {
            const limit = +maxHalfLife;

            if (!Number.isNaN(limit)) {
                publishedList = publishedList.filter(isotope => isotope.halfLife <= limit);
            }
        }

        return {
            isotopes: publishedList.map(formatIsotope),
            maxHalfLife: maxHalfLife || '',
        }
    }
}
