import { Body, Controller, Post, Res, UseGuards } from '@nestjs/common';

import { AuthReq } from './auth.deco.js';
import { AuthOnly, GuestOnly } from './auth.guards.js';
import { AuthService } from './auth.service.js';
import { LoginDTO } from './dto/login.dto.js';
import { RegisterDTO } from './dto/register.dto.js';

import type { AuthRequest } from './auth.deco.js';

import type { Response } from "express";

@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
    ) { }

    @UseGuards(GuestOnly)
    @Post('')
    async register(
        @Body() dto: RegisterDTO,
        @Res({ passthrough: true }) res: Response,
    ) {
        const result = await this.authService.register(dto);
        res.cookie('session', result.sessionId, {
            httpOnly: true,
            secure: false,
        });

        return result.user;
    }

    @UseGuards(GuestOnly)
    @Post('/login')
    async login(
        @Body() dto: LoginDTO,
        @Res({ passthrough: true }) res: Response,
    ) {
        const result = await this.authService.login(dto);
        res.cookie('session', result.sessionId, {
            httpOnly: true,
            secure: false,
        });

        return result.user;
    }

    @UseGuards(AuthOnly)
    @Post('/logout')
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
