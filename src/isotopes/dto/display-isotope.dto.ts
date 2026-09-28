import { Isotope } from '../entities/isotope.entity.js';

export type IsotopeDTO = {
    isotope: Isotope;
    likeCount: number;
    isLiked: boolean;
    isAuthor: boolean;
};
