import { LessThanOrEqual, MoreThan, Repository } from 'typeorm';

import { ConflictException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { IsotopeDraftDTO } from './dto/create-isotope-draft.dto.js';
import { IsotopeDTO } from './dto/display-isotope.dto.js';
import { IsotopePublishDTO } from './dto/publish-isotope.dto.js';
import { LikeResult } from './dto/set-like.dto.js';
import { Isotope, IsotopeStatus } from './entities/isotope.entity.js';
import { Like } from './entities/like.entity.js';
import { MinioService } from './storage/storage.service.js';
import { toIsotopeView } from './views/isotope-view.mapper.js';
import { IsotopeView } from './views/isotope.view.js';

export enum LikeAction {
    Remove,
    Add,
}

@Injectable()
export class IsotopeService {
    constructor(
        @InjectRepository(Isotope)
        private readonly isotopeRepository: Repository<Isotope>,

        @InjectRepository(Like)
        private readonly likeRepository: Repository<Like>,

        private readonly minioStorageRepository: MinioService,
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
                Number(row.isotopeId),
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
        dto: IsotopeDraftDTO,
        videoFile?: Express.Multer.File,
        imageFile?: Express.Multer.File,
    ): Promise<IsotopeView> {
        const hasDraft = await this.isotopeRepository.exists({
            where: {
                author: {
                    id: userId,
                },
                status: IsotopeStatus.Draft,
            },
        });

        if (hasDraft) {
            throw new ConflictException('Черновик уже существует');
        }

        const [videoResult, imageResult] = await Promise.allSettled([
            videoFile !== undefined
                ? this.minioStorageRepository.store(videoFile)
                : Promise.resolve(undefined),

            imageFile !== undefined
                ? this.minioStorageRepository.store(imageFile)
                : Promise.resolve(undefined),
        ]);

        const uploadedKeys = [videoResult, imageResult]
            .filter(
                (result): result is PromiseFulfilledResult<string> =>
                    result.status === 'fulfilled' && result.value !== undefined
            )
            .map(result => result.value);

        if (
            imageResult.status === 'rejected' ||
            videoResult.status === 'rejected'
        ) {

            this.minioStorageRepository.remove(uploadedKeys);
            throw new InternalServerErrorException('Ошибка при загрузке медиа');
        }

        const imageUrl = imageResult.value;
        const videoUrl = videoResult.value;

        try {
            const draft = await this.isotopeRepository.save(
                this.isotopeRepository.create({
                    ...dto,
                    videoUrl,
                    imageUrl,
                    status: IsotopeStatus.Draft,
                    author: {
                        id: userId,
                    },
                })
            );

            const assembled = await this.assembleDTO(draft, userId);
            return toIsotopeView(assembled);

        } catch (error) {
            this.minioStorageRepository.remove(uploadedKeys);
            throw error;
        }
    }

    async publishDraft(
        userId: number,
        dto: IsotopePublishDTO,
    ): Promise<IsotopeView> {
        const draft = await this.isotopeRepository.findOne({
            where: {
                status: IsotopeStatus.Draft,
                author: {
                    id: userId,
                },
            },
        });

        if (!draft) {
            throw new NotFoundException();
        }

        draft.halfLife = dto.halfLife;
        draft.isAlpha = dto.isAlpha;
        draft.description = dto.description;
        draft.status = IsotopeStatus.Published;
        draft.publishedAt = new Date();

        const published = await this.isotopeRepository.save(draft);

        const assembled = await this.assembleDTO(published, userId);
        return toIsotopeView(assembled);
    }

    async deletePublished(
        userId: number,
        isotopeId: number,
    ): Promise<boolean> {
        const result = await this.isotopeRepository.query(`
            UPDATE isotope
            SET status=$1
            WHERE id=$2
            AND author_id=$3
            AND status=$4
            RETURNING id
        `, [
            IsotopeStatus.Deleted,
            isotopeId,
            userId,
            IsotopeStatus.Published,
        ]);

        console.log(result);
        return result;
    }

    async like(
        userId: number,
        isotopeId: number,
        action: LikeAction,
    ): Promise<LikeResult> {
        const isotope = await this.isotopeRepository.findOne({
            where: {
                id: isotopeId,
                status: IsotopeStatus.Published,
            },
        });

        if (!isotope) {
            throw new NotFoundException();
        }

        switch (action) {
            case LikeAction.Remove:
                await this.likeRepository.delete({
                    user: { id: userId },
                    isotope: { id: isotopeId },
                })
                break;

            case LikeAction.Add:
                await this.likeRepository.upsert(
                    {
                        user: { id: userId },
                        isotope: { id: isotopeId },
                    },
                    ['user', 'isotope'],
                )
                break;
        }

        const [isLiked, likeCount] = await Promise.all([
            this.likeRepository.exists({
                where: {
                    user: {
                        id: userId,
                    },
                    isotope: {
                        id: isotopeId,
                    },
                },
            }),

            this.likeRepository.count({
                where: {
                    isotope: {
                        id: isotopeId,
                    },
                },
            }),
        ]);

        return {
            isLiked,
            likeCount,
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
