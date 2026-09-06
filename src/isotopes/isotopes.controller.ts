import { Controller, Get, NotFoundException, Param, Query, Render } from '@nestjs/common';

export const MINIO_URL = 'http://localhost:9000/isotopes';

enum IsotopeStatus {
    Draft = 0,
    Published,
    Deleted,
};

export const USER = [
    { id: 1 },
    { id: 2 }
];

export const ISOTOPE = [
    {
        id: 1,
        name: 'Торий-232',
        halfLife: 443073600000000000,
        description: 'Самый долгоживущий изотоп тория. Применяется в перспективном торий-урановом цикле.',
        videoUrl: '5f1d8212-8e9b-42d3-a456-426614174001.mp4',
        imageUrl: 'a4a2a11b-8c2d-4e9f-9b1a-283451000001.jpg',
        status: IsotopeStatus.Published,
        authorId: 1
    },
    {
        id: 2,
        name: 'Калий-40',
        halfLife: 39373200000000000,
        description: '0.012% природного калия. Содержится в продуктах питания и теле человека (~4400 Бк).',
        videoUrl: '7c9e6679-3b1a-4d2f-89bc-318492000002.mp4',
        imageUrl: 'd52f6c9d-4e2b-4a1c-901d-528493000002.jpg',
        status: IsotopeStatus.Published,
        authorId: 1
    },
    {
        id: 3,
        name: 'Плутоний-240',
        halfLife: 207070776000,
        description: 'Примесь в оружейном плутонии — спонтанное деление делает его непригодным для орудия взрывного типа.',
        videoUrl: '3b241101-1a2b-4c3d-8e4f-567890000003.mp4',
        imageUrl: '9a6d0932-9b8c-4a7d-8e6f-123456000003.png',
        status: IsotopeStatus.Published,
        authorId: 1
    },
    {
        id: 4,
        name: 'Радий-226',
        halfLife: 50492160000,
        description: 'Открыт Марией Кюри в 1898 г. Использовался в светящихся красках (Undark). Источник радона.',
        videoUrl: '0e334a12-8d7c-4b69-a1b2-c3d4e5000004.mp4',
        imageUrl: '8d7c4b69-0e33-4a12-b2c3-d4e5f6000004.jpg',
        status: IsotopeStatus.Published,
        authorId: 1
    },
    {
        id: 5,
        name: 'Актиний-227',
        halfLife: 686940864,
        description: 'Дал название актиниевому ряду. Преимущественно β-распад (98.6%) в Th-227, малая доля α-распада в Fr-223.',
        videoUrl: 'c8e76a14-f47a-4c10-b1a2-345678000005.mp4',
        imageUrl: 'f47ac10b-c8e7-4a14-a2b3-c4d5e6000005.jpeg',
        status: IsotopeStatus.Draft,
        authorId: 1
    },
    {
        id: 6,
        name: 'Ксенон-133',
        halfLife: 452736,
        description: 'Продукт деления, выброшен при Чернобыльской аварии. Применяется в пульмонологии.',
        videoUrl: '6c905581-2d9d-4150-a2b3-c4d5e6000006.mp4',
        imageUrl: '2d9d1502-6c90-4558-b1c2-d3e4f5000006.jpg',
        status: IsotopeStatus.Deleted,
        authorId: 1
    },
    {
        id: 7,
        name: 'Полоний-218',
        halfLife: 186,
        description: 'Первый твёрдый продукт распада радона. Оседает на пыли и поверхностях в помещении, облучает лёгкие.',
        videoUrl: 'e3d7454f-1b9d-4bcd-8e9f-012345000007.mp4',
        imageUrl: '1b9d6bcd-e3d7-454f-a9b8-c7d6e5000007.jpg',
        status: IsotopeStatus.Published,
        authorId: 1
    }
];

export const RADIATION_TYPE = [
  { id: 1, name: 'α' },
  { id: 2, name: 'β+' },
  { id: 3, name: 'β-' },
  { id: 4, name: 'γ' },
  { id: 5, name: 'СД' },
  { id: 6, name: 'ИП' },
  { id: 7, name: 'ЭЗ' },
];

export const ISOTOPE_RADIATION_TYPE = [
    {id: 1, isotopeId: 1, radiationTypeId: 1},
    {id: 2, isotopeId: 2, radiationTypeId: 3},
    {id: 3, isotopeId: 2, radiationTypeId: 4},
    {id: 4, isotopeId: 3, radiationTypeId: 1},
    {id: 5, isotopeId: 3, radiationTypeId: 5},
    {id: 6, isotopeId: 4, radiationTypeId: 1},
    {id: 7, isotopeId: 4, radiationTypeId: 4},
    {id: 8, isotopeId: 5, radiationTypeId: 1},
    {id: 9, isotopeId: 5, radiationTypeId: 3},
    {id: 10, isotopeId: 6, radiationTypeId: 3},
    {id: 11, isotopeId: 6, radiationTypeId: 4},
    {id: 12, isotopeId: 7, radiationTypeId: 1},
]


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

    const radiationTypesIds = ISOTOPE_RADIATION_TYPE
        .filter(link => link.isotopeId === isotope.id)
        .map(link => link.radiationTypeId);

    const radiationTypes = RADIATION_TYPE.filter(radiationType => radiationTypesIds.includes(radiationType.id));

    return {
        ...isotope,
        likeCount,
        halfLifeFormatted: formatHalfLife(isotope.halfLife),
        radiationTypes,
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
            RADIATION_TYPE,
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
