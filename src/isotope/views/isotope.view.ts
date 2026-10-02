export type IsotopeView = {
    id: number;
    name: string;
    description: string | null;
    imageUrl: string | null;
    videoUrl: string | null;
    halfLife: string | null;
    halfLifeFormatted: string;
    isAlpha: boolean | null;

    likeCount: number;
    isLiked: boolean;
    isAuthor: boolean;
};
