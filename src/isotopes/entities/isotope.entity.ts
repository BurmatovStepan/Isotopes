import {
    Check,
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    RelationId
} from 'typeorm';

import { Like } from './like.entity.js';
import { User } from './user.entity.js';

import type { Relation } from 'typeorm';

export enum IsotopeStatus {
    Draft,
    Published,
    Deleted,
};

const bigintTransformer = {
    to(value: bigint | null): string | null {
        return value === null || value === undefined
            ? null
            : value.toString();
    },

    from(value: string | null): bigint | null {
        return value === null
            ? null
            : BigInt(value);
    },
};

@Entity({ name: 'isotope' })
@Check(`"status" IN (0, 1, 2)`)
@Check(`"half_life" > 0`)
export class Isotope {
    @PrimaryGeneratedColumn('identity', {
        generatedIdentity: 'ALWAYS',
    })
    id: number;

    @Column({
        type: 'text',
        nullable: false
    })
    name: string | null;

    @Column({
        type: 'text',
        nullable: true
    })
    description: string | null;

    @Column({
        name: 'image_url',
        type: 'text',
        nullable: true,
    })
    imageUrl: string | null;

    @Column({
        name: 'video_url',
        type: 'text',
        nullable: true,
    })
    videoUrl: string | null;

    @Column({
        name: 'half_life',
        type: 'numeric',
        nullable: true,
        transformer: bigintTransformer,
    })
    halfLife: bigint | null;

    @Column({
        name: 'is_alpha',
        type: 'boolean',
        nullable: true,
    })
    isAlpha: boolean | null;

    @Column({
        type: 'smallint',
        default: IsotopeStatus.Draft,
    })
    status: IsotopeStatus;

    @ManyToOne(() => User, user => user.isotopes, {
        nullable: false,
    })
    @JoinColumn({
        name: 'author_id',
        referencedColumnName: 'id',
    })
    author: Relation<User>;

    @RelationId((isotope: Isotope) => isotope.author)
    authorId: number

    @CreateDateColumn({
        name: 'created_at',
        type: 'timestamptz',
        nullable: false,
        default: () => 'CURRENT_TIMESTAMP',
    })
    createdAt: Date;

    @Column({
        name: 'published_at',
        type: 'timestamptz',
        nullable: true,
    })
    publishedAt: Date | null;

    @OneToMany(() => Like, like => like.isotope)
    likes: Relation<Like[]>;
}
