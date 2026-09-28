
import { Repository } from 'typeorm';

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { User } from '../users/entities/user.entity.js';
import { RegisterDTO } from './dto/register-user.dto.js';
import { Password } from './password.js';
import { toUserView } from './views/user-view.mapper.js';
import { UserView } from './views/user.view.js';

class NameAlreadyTakenException extends Error {
    constructor() {
        super('Это имя уже занято');
        Error.captureStackTrace(this, this.constructor)
    }
}

@Injectable()
export class UserRepository {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
    ) { }

    async register(
        dto: RegisterDTO,
    ): Promise<UserView> {
        const similarUser = await this.userRepository.findOne({
            where: {
                login: dto.login,
            },
        });

        if (similarUser) {
            throw new NameAlreadyTakenException();
        }

        const user = await this.userRepository.save(
            this.userRepository.create({
                login: dto.login,
                password_hash: await Password.hashPassword(dto.password),
            })
        );

        return toUserView(user);
    }
}
