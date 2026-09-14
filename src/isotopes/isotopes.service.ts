import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Isotope, IsotopeStatus } from './entities/isotope.entity.js';
import { MoreThan, Repository } from 'typeorm';
import { Like } from './entities/like.entity.js';

export type IsotopeView = {
    isotope: Isotope;
    likeCount: number;
    isLiked: boolean;
};

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
        currentUserId?: number,
    ): Promise<IsotopeView | null> {
        const isotope = await this.isotopeRepository.findOne({
            where: {
                id: isotopeId,
                status: IsotopeStatus.Published,
            },
        });

        if (!isotope) return null;

        return this.buildView(isotope, currentUserId);
    }

    async getFirstPublished(
        currentUserId?: number
    ): Promise<IsotopeView | null> {
        const isotope = await this.isotopeRepository.findOne({
            where: {
                status: IsotopeStatus.Published,
            },
            order: {
                id: 'ASC',
            },
        });

        if (!isotope) return null;

        return this.buildView(isotope, currentUserId);
    };

    async getNextPublished(
        id: number,
        currentUserId?: number,
    ): Promise<IsotopeView | null> {
        const isotope = await this.isotopeRepository.findOne({
            where: {
                status: IsotopeStatus.Published,
                id: MoreThan(id),
            },

            order: {
                id: 'ASC',
            }
        });

        if (!isotope) return null;

        return this.buildView(isotope, currentUserId);
    }

    private async buildView(
        isotope: Isotope,
        currentUserId?: number
    ): Promise<IsotopeView> {
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
        };
    }
}
