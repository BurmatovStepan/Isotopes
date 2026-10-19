import { Body, Controller, Post, Res, UseGuards } from '@nestjs/common';
import {
    ApiBody,
    ApiConsumes,
    ApiCookieAuth,
    ApiOperation,
    ApiResponse,
    ApiTags
} from '@nestjs/swagger';

import { AuthReq } from './auth.deco.js';
import { AuthOnly, GuestOnly } from './auth.guards.js';
import { AuthService } from './auth.service.js';
import { LoginDTO } from './dto/login.dto.js';
import { RegisterDTO } from './dto/register.dto.js';

import type { AuthRequest } from './auth.deco.js';

import type { Response } from "express";

@ApiTags('auth')
@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
    ) { }

    @UseGuards(GuestOnly)
    @Post('')
    @ApiOperation({ summary: 'Регистрация пользователя' })
    @ApiConsumes('application/json')
    @ApiBody({ type: RegisterDTO })
    @ApiResponse({
        status: 201,
        description: 'Пользователь зарегистрирован, установлена cookie session',
    })
    @ApiResponse({ status: 403, description: 'Пользователь уже авторизован' })
    @ApiResponse({ status: 409, description: 'Логин уже занят' })
    async register(
        @Body() dto: RegisterDTO,
        @Res({ passthrough: true }) res: Response,
    ) {
        const result = await this.authService.register(dto);
        res.cookie('session', result.sessionId, {
            httpOnly: true,
            secure: false,
        });

        return { userId: result.userId };
    }

    @UseGuards(GuestOnly)
    @Post('/login')
    @ApiOperation({ summary: 'Вход по логину и паролю' })
    @ApiConsumes('application/json')
    @ApiBody({ type: LoginDTO })
    @ApiResponse({
        status: 201,
        description: 'Вход выполнен, установлена cookie session',
    })
    @ApiResponse({ status: 401, description: 'Неверный логин или пароль' })
    @ApiResponse({ status: 403, description: 'Пользователь уже авторизован' })
    async login(
        @Body() dto: LoginDTO,
        @Res({ passthrough: true }) res: Response,
    ) {
        const result = await this.authService.login(dto);
        res.cookie('session', result.sessionId, {
            httpOnly: true,
            secure: false,
        });

        return { userId: result.userId };
    }

    @UseGuards(AuthOnly)
    @Post('/logout')
    @ApiCookieAuth('session')
    @ApiOperation({ summary: 'Выход из системы' })
    @ApiResponse({
        status: 201,
        description: 'Сессия удалена, cookie очищена',
    })
    @ApiResponse({ status: 401, description: 'Требуется авторизация' })
    async logout(
        @AuthReq() req: AuthRequest,
        @Res({ passthrough: true }) res: Response,
    ) {
        await this.authService.logout(req.sessionId);

        res.clearCookie('session', {
            httpOnly: true,
            secure: false,
        });
    }
}
