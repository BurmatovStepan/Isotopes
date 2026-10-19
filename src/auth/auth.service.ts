import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';

import { Password } from '../password.helper.js';
import { SessionService } from '../session/session.service.js';
import { User } from '../user/entities/user.entity.js';
import { UserService } from '../user/user.service.js';
import { AuthResult } from './dto/auth.dto.js';
import { LoginDTO } from './dto/login.dto.js';
import { RegisterDTO } from './dto/register.dto.js';

@Injectable()
export class AuthService {
    constructor(
        private readonly userService: UserService,

        private readonly sessionService: SessionService,
    ) { }

    async register(
        dto: RegisterDTO,
    ): Promise<AuthResult> {
        const loginExists = await this.userService.loginExists(dto.login);


        if (loginExists) {
            throw new ConflictException('Это имя уже занято');
        }

        try {
            const user = await this.userService.createUser(dto.login, dto.password);

            return await this.toAuthResult(user);

        } catch (error) {
            if ((error as { code?: string }).code === '23505') {
                throw new ConflictException('Это имя уже занято');
            }

            throw error;
        }
    }

    async login(
        dto: LoginDTO,
    ): Promise<AuthResult> {
        const user = await this.userService.getByLogin(dto.login);

        if (
            !user ||
            !(await Password.comparePassword(user.password_hash, dto.password))
        ) {
            throw new UnauthorizedException('Неправильный логин или пароль');
        }

        return await this.toAuthResult(user);
    }

    async logout(
        sessionId: string,
    ): Promise<void> {
        await this.sessionService.destroy(sessionId);
    }

    private async toAuthResult(user: User): Promise<AuthResult> {
        const sessionId = crypto.randomUUID();
        await this.sessionService.create(sessionId, user.id);

        return {
            userId: user.id,
            sessionId,
        }
    }
}
