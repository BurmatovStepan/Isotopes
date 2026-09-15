import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Isotope, IsotopeStatus } from './entities/isotope.entity.js';
import { LessThanOrEqual, MoreThan, Repository } from 'typeorm';
import { Like } from './entities/like.entity.js';

const MINIO_URL = 'http://localhost:9000/isotopes';
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

export type IsotopeDTO = {
    isotope: Isotope;
    likeCount: number;
    isLiked: boolean;
    isAuthor: boolean;
};

export type IsotopeView = Isotope & {
    likeCount: number;
    isLiked: boolean;
    isAuthor: boolean;
    radiationTypeClass: string;
    radiationTypeValue: string;
    halfLifeFormatted: string;
    fullVideoUrl: string | null;
    fullImageUrl: string | null;
};

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

function toIsotopeView(dto: IsotopeDTO): IsotopeView {
    const { isotope, ...meta } = dto;
    return {
        ...meta,
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


@Injectable()
export class IsotopesService {
    constructor(
        @InjectRepository(Isotope)
        private readonly isotopeRepository: Repository<Isotope>,
        @InjectRepository(Like)
        private readonly likeRepository: Repository<Like>,
    ) { }

    async getPublishedById(
        isotopeId: number,
        currentUserId?: number
    ): Promise<IsotopeView | null> {
        const isotope = await this.isotopeRepository.findOne({
            where: {
                id: isotopeId,
                status: IsotopeStatus.Published
            },
        });

        if (!isotope) return null;

        const dto = await this.assembleDTO(isotope, currentUserId);
        return toIsotopeView(dto);
    }

    async getFirstPublished(
        currentUserId?: number
    ): Promise<IsotopeView | null> {
        const isotope = await this.isotopeRepository.findOne({
            where: {
                status: IsotopeStatus.Published
            },
            order: {
                id: 'ASC'
            },
        });

        if (!isotope) return null;

        const dto = await this.assembleDTO(isotope, currentUserId);
        return toIsotopeView(dto);
    }

    async getNextPublished(
        id: number,
        currentUserId?: number
    ): Promise<IsotopeView | null> {
        const isotope = await this.isotopeRepository.findOne({
            where: {
                status: IsotopeStatus.Published,
                id: MoreThan(id)
            },
            order: {
                id: 'ASC'
            },
        });

        if (!isotope) return null;

        const dto = await this.assembleDTO(isotope, currentUserId);
        return toIsotopeView(dto);
    }

    async getPublished(
        maxHalfLife?: bigint,
        currentUserId?: number
    ): Promise<IsotopeView[]> {
        const isotopes = await this.isotopeRepository.find({
            where: {
                status: IsotopeStatus.Published,
                ...(maxHalfLife !== undefined && { halfLife: LessThanOrEqual(maxHalfLife) })
            },
            order: {
                id: 'ASC'
            },
        });

        if (!isotopes.length) return [];

        const isotopeIds = isotopes.map(i => i.id);

        const likeCounts = await this.likeRepository
            .createQueryBuilder('like')
            .select('like.isotope_id', 'isotopeId')
            .addSelect('COUNT(like.id)', 'likeCount')
            .where('like.isotope_id IN (:...isotopeIds)', { isotopeIds })
            .groupBy('like.isotope_id')
            .getRawMany<{
                isotopeId: number;
                likeCount: string
            }>();

        const likedByCurrentUser = currentUserId === undefined
            ? []
            : await this.likeRepository
                .createQueryBuilder('like')
                .select('like.isotope_id', 'isotopeId')
                .where('like.user_id = :currentUserId', { currentUserId })
                .andWhere('like.isotope_id IN (:...isotopeIds)', { isotopeIds })
                .getRawMany<{
                    isotopeId: number
                }>();

        const likeCountByIsotopeId = new Map(
            likeCounts.map(row => [
                row.isotopeId,
                Number(row.likeCount),
            ]),
        );

        const likedIsotopeIds = new Set(
            likedByCurrentUser.map(row => Number(row.isotopeId)),
        );

        return isotopes.map(isotope => {
            const dto: IsotopeDTO = {
                isotope,
                likeCount: likeCountByIsotopeId.get(isotope.id) ?? 0,
                isLiked: likedIsotopeIds.has(isotope.id),
                isAuthor: isotope.authorId === currentUserId,
            };
            return toIsotopeView(dto);
        });
    }

    private async assembleDTO(isotope: Isotope, currentUserId?: number): Promise<IsotopeDTO> {
        const [likeCount, userLike] = await Promise.all([
            this.likeRepository.count({
                where: {
                    isotope: {
                        id: isotope.id,
                    },
                },
            }),

            currentUserId !== undefined
                ? this.likeRepository.findOne({
                    where: {
                        isotope: {
                            id: isotope.id,
                        },
                        user: {
                            id: currentUserId,
                        },
                    },
                })
                : null
        ]);

        return {
            isotope,
            likeCount,
            isLiked: userLike !== null,
            isAuthor: isotope.authorId === currentUserId,
        };
    }
}
