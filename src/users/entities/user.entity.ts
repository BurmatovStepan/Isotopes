import { Column, Entity, OneToMany, PrimaryGeneratedColumn, Unique } from 'typeorm';

import { Isotope } from '../../isotopes/entities/isotope.entity.js';
import { Like } from '../../isotopes/entities/like.entity.js';

import type { Relation } from 'typeorm';

@Entity({name: 'user'})
@Unique(['login'])
export class User {
    @PrimaryGeneratedColumn('identity', {
        generatedIdentity: 'ALWAYS',
    })
    id: number;

    @OneToMany(() => Isotope, isotope => isotope.author)
    isotopes: Relation<Isotope[]>;

    @OneToMany(() => Like, like => like.user)
    likes: Relation<Like[]>;

    @Column({
        name: 'login',
        type: 'text',
        nullable: false,
    })
    login: string;

    @Column({
        name: 'password_hash',
        type: 'text',
        nullable: false,
    })
    password_hash: string;
}
