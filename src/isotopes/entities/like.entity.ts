import { Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, RelationId, Unique } from 'typeorm';

import { Isotope } from './isotope.entity.js';
import { User } from './user.entity.js';

import type { Relation } from 'typeorm';

@Entity({ name: 'like' })
@Unique('uk_user_isotope', ['user', 'isotope'])
export class Like {
    @PrimaryGeneratedColumn('identity', {
        generatedIdentity: 'ALWAYS',
    })
    id: number;

    @ManyToOne(() => User, user => user.likes, {
        nullable: false,
    })
    @JoinColumn({
        name: 'user_id',
        referencedColumnName: 'id',
    })
    user: Relation<User>;

    @RelationId((like: Like) => like.user)
    userId: number

    @ManyToOne(() => Isotope, isotope => isotope.likes, {
        nullable: false,
    })
    @JoinColumn({
        name: 'isotope_id',
        referencedColumnName: 'id',
    })
    isotope: Relation<Isotope>;

    @RelationId((like: Like) => like.isotope)
    isotopeId: number
}
