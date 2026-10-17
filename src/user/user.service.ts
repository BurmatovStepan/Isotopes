import { Repository } from 'typeorm';

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Password } from '../password.helper.js';
import { User } from './entities/user.entity.js';

function normalizeLogin(login: string) {
    return login.trim().toLowerCase();
}

@Injectable()
export class UserService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
    ) { }

    async loginExists(
        login: string
    ): Promise<boolean> {
        const loginNormalized = normalizeLogin(login);
        const user = await this.userRepository.findOne({
            where: {
                login: loginNormalized,
            },
        });

        return Boolean(user);
    }

    async createUser(
        login: string,
        password: string,
    ): Promise<User> {
        return await this.userRepository.save(
            this.userRepository.create({
                login: normalizeLogin(login),
                password_hash: await Password.hashPassword(password),
            })
        );
    }

    async getByLogin(
        login: string,
    ): Promise<User | null> {
        return await this.userRepository.findOne({
            where: {
                login: normalizeLogin(login),
            },
        });
    }
}
