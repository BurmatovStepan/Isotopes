
import { Repository } from 'typeorm';

import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { User } from './entities/user.entity.js';
import { RegisterDTO } from './dto/register-user.dto.js';
import { Password } from './password.js';
import { toUserView } from './views/user-view.mapper.js';
import { UserView } from './views/user.view.js';

@Injectable()
export class UserService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
    ) { }

    async register(
        dto: RegisterDTO,
    ): Promise<UserView> {
        const login = dto.login.trim().toLowerCase()

        const similarUser = await this.userRepository.findOne({
            where: {
                login,
            },
        });

        if (similarUser) {
            throw new ConflictException('Это имя уже занято');
        }

        try {
            const user = await this.userRepository.save(
                this.userRepository.create({
                    login,
                    password_hash: await Password.hashPassword(dto.password),
                })
            );

            return toUserView(user);

        } catch (error) {
            if ((error as { code?: string }).code === '23505') {
                throw new ConflictException('Это имя уже занято');
            }

            throw error;
        }


    }
}
