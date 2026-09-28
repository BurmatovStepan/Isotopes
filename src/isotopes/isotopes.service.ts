import { Transform } from 'class-transformer';
import {
    IsBoolean,
    isNotEmpty,
    IsNotEmpty,
    isString,
    IsString,
    IsStrongPassword,
    registerDecorator,
    ValidationOptions
} from 'class-validator';
import { LessThanOrEqual, MoreThan, Repository } from 'typeorm';

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Isotope, IsotopeStatus } from './entities/isotope.entity.js';
import { Like } from './entities/like.entity.js';
import { User } from './entities/user.entity.js';
import { BinaryLike, randomBytes, scrypt, ScryptOptions, scryptSync, timingSafeEqual } from 'crypto';
import { promisify } from 'util';

const MINIO_URL = 'http://localhost:9000/isotopes';
const NANOSECONDS_PER_SECOND = 1000000000n;
const SECONDS_PER_YEAR = 31556952n;

const TIME_UNITS = [
    { label: 'млрд. л.', nanoseconds: SECONDS_PER_YEAR * 1000000000n * NANOSECONDS_PER_SECOND },
    { label: 'млн. л.', nanoseconds: SECONDS_PER_YEAR * 1000000n * NANOSECONDS_PER_SECOND },
    { label: 'тыс. л.', nanoseconds: SECONDS_PER_YEAR * 1000n * NANOSECONDS_PER_SECOND },
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

export function IsBigInt(validationOptions?: ValidationOptions) {
    return function (object: object, propertyName: string) {
        registerDecorator({
            name: 'isBigInt',
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            validator: {
                validate(value: any) {
                    return typeof value === 'bigint' && value >= 0n;
                },
            },
        });
    };
}

export class IsotopeDraftDTO {
    @IsNotEmpty()
    @IsString()
    name: string;
}

export class IsotopePublishDTO {
    @Transform(({ value }) => {
        if (value === undefined || value === null || value === '') return undefined;

        try {
            return BigInt(value);
        } catch {
            return Symbol('INVALID_BIGINT');
        }
    })
    @IsNotEmpty()
    @IsBigInt({ message: 'период полураспада должен быть положительным целым числом или 0' })
    halfLife: bigint;

    @Transform(({ value }) => value === 'on')
    @IsBoolean()
    isAlpha: boolean = false;

    @IsNotEmpty()
    @IsString()
    description: string;
};


export type IsotopeView = Isotope & {
    likeCount: number;
    isLiked: boolean;
    isAuthor: boolean;
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

    async getDraft(
        userId: number,
    ): Promise<IsotopeView | null> {
        const draft = await this.isotopeRepository.findOne({
            where: {
                status: IsotopeStatus.Draft,
                author: {
                    id: userId,
                },
            },
        });

        if (!draft) return null;

        const dto = await this.assembleDTO(draft, userId);
        return toIsotopeView(dto);
    }

    async createDraft(
        userId: number,
        dto: IsotopeDraftDTO
    ): Promise<void> {
        const draft = this.isotopeRepository.create({
            ...dto,
            status: IsotopeStatus.Draft,
            author: {
                id: userId,
            },
        });

        await this.isotopeRepository.save(draft);
    }

    async publishDraft(
        userId: number,
        draftId: number,
        dto: IsotopePublishDTO,
    ): Promise<void> {
        const result = await this.isotopeRepository.update({
            id: draftId,
            status: IsotopeStatus.Draft,
            author: {
                id: userId,
            },

        }, {
            ...dto,
            status: IsotopeStatus.Published,
            publishedAt: new Date(),
        });

        if (result.affected !== 1) {
            throw new NotFoundException();
        }
    }

    async deletePublished(
        userId: number,
        isotopeId: number,
    ): Promise<void> {
        await this.isotopeRepository.query(`
            UPDATE isotope
            SET status=$1
            WHERE id=$2
            AND author_id=$3
        `, [
            IsotopeStatus.Deleted,
            isotopeId,
            userId
        ]);
    }

    async like(
        userId: number,
        isotopeId: number,
    ): Promise<void> {
        const isotope = await this.isotopeRepository.findOne({
            where: {
                id: isotopeId,
                status: IsotopeStatus.Published,
            },
        });

        if (!isotope) {
            throw new NotFoundException();
        }

        const userLike = await this.likeRepository.findOne({
            where: {
                user: {
                    id: userId,
                },
                isotope: {
                    id: isotopeId,
                },
            },
        });

        if (userLike) {
            this.likeRepository.remove(userLike);

        } else {
            await this.likeRepository.save(
                await this.likeRepository.create({
                    user: {
                        id: userId,
                    },
                    isotope: {
                        id: isotopeId,
                    },
                })
            )
        }
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

export class RegisterDTO {
    @IsNotEmpty()
    @IsString()
    login: string;

    @IsNotEmpty()
    @IsString()
    @IsStrongPassword()
    password: string;
}

class NameAlreadyTakenException extends Error {
    constructor() {
        super('Это имя уже занято');
        Error.captureStackTrace(this, this.constructor)
    }
}

class PasswordHashFailedException extends Error {
    constructor() {
        super('Не удалось хешировать пароль');
        Error.captureStackTrace(this, this.constructor)
    }
}

export class Password {
    private static readonly scryptAsync: (
        password: BinaryLike,
        salt: BinaryLike,
        keylen: number,
        options?: ScryptOptions,
    ) => Promise<Buffer> = promisify(scrypt);

    static async hashPassword(password: string) {
        const salt = randomBytes(16).toString("hex");

        try {
            const passwordBuffer = await this.scryptAsync(password, salt, 64);
            return `${passwordBuffer.toString('hex')}.${salt}`

        } catch {
            throw new PasswordHashFailedException();
        }
    }

    static async comparePassword(
        storedPassword: string,
        suppliedPassword: string
    ): Promise<boolean> {
        const [hashedPassword, salt] = storedPassword.split(".");
        const hashedPasswordBuffer = Buffer.from(hashedPassword, "hex");

        try {
            const suppliedPasswordBuffer = await this.scryptAsync(suppliedPassword, salt, 64);
            return timingSafeEqual(hashedPasswordBuffer, suppliedPasswordBuffer);

        } catch {
            throw new PasswordHashFailedException();
        }
    }
}

@Injectable()
export class UserRepository {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
    ) { }

    async register(
        dto: RegisterDTO,
    ): Promise<void> {
        const similarUser = await this.userRepository.findOne({
            where: {
                login: dto.login,
            },
        });

        if (similarUser) {
            throw new NameAlreadyTakenException();
        }

        await this.userRepository.save(
            await this.userRepository.create({
                login: dto.login,
                password_hash: await Password.hashPassword(dto.password),
            })
        )
    }
}
