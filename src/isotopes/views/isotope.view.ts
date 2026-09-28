import { Isotope } from '../entities/isotope.entity.js';

export type IsotopeView = Isotope & {
    likeCount: number;
    isLiked: boolean;
    isAuthor: boolean;
    halfLifeFormatted: string;
    fullVideoUrl: string | null;
    fullImageUrl: string | null;
};
