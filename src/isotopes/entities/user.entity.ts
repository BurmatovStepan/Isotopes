import { Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

import { Isotope } from './isotope.entity.js';
import { Like } from './like.entity.js';

import type { Relation } from 'typeorm';

@Entity({name: 'user'})
export class User {
    @PrimaryGeneratedColumn('identity', {
        generatedIdentity: 'ALWAYS',
    })
    id: number;

    @OneToMany(() => Isotope, isotope => isotope.author)
    isotopes: Relation<Isotope[]>;

    @OneToMany(() => Like, like => like.user)
    likes: Relation<Like[]>;
}
