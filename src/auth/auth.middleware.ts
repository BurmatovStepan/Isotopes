import { NextFunction, Request, Response } from 'express';

import { Injectable, NestMiddleware } from '@nestjs/common';

import { SessionService } from '../session/session.service.js';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
    constructor(
        private readonly sessionService: SessionService,
    ) { }

    async use(req: Request, res: Response, next: NextFunction) {
        const sessionId = req.cookies.session;
        req.auth = false;
        req.userId = undefined;
        req.sessionId = undefined;

        if (typeof sessionId !== 'string') {
            return next();
        }

        try {
            const userId = await this.sessionService.getUserId(sessionId);

            if (userId === null) {
                return next();
            }

            req.auth = true;
            req.sessionId = sessionId;
            req.userId = userId;

            return next();
        } catch (error) {
            return next(error);
        }
    }
}
