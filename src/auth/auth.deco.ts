import { Request } from 'express';

import {
    createParamDecorator,
    ExecutionContext,
    ForbiddenException,
    UnauthorizedException
} from '@nestjs/common';

export type AuthRequest = Request & {
    auth: true;
    userId: number;
    sessionId: string;
};

export type GuestRequest = Request & {
    auth: false;
    userId?: never;
    sessionId?: never;
};

export type AppRequest = AuthRequest | GuestRequest;

declare global {
    namespace Express {
        interface Request {
            auth: boolean;
            userId?: number;
            sessionId?: string;
        }
    }
}

function isAuthRequest(
    req: Request,
): req is AuthRequest {
    return (
        req.auth === true &&
        typeof req.userId === "number" &&
        typeof req.sessionId === "string"
    );
}

function isGuestRequest(req: Request): req is GuestRequest {
    return (
        req.auth === false &&
        req.userId === undefined &&
        req.sessionId === undefined
    );
}

export const AuthReq = createParamDecorator(
    (data: unknown, context: ExecutionContext): AuthRequest => {
        const req = context.switchToHttp().getRequest<Request>();

        if (!isAuthRequest(req)) {
            throw new UnauthorizedException();
        }

        return req;
    }
);

export const GuestReq = createParamDecorator(
    (data: unknown, context: ExecutionContext): GuestRequest => {
        const req = context.switchToHttp().getRequest<Request>();

        if (!isGuestRequest(req)) {
            throw new ForbiddenException();
        }

        return req;
    }
);
