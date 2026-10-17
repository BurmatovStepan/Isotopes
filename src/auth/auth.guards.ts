import {
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Injectable,
    UnauthorizedException
} from '@nestjs/common';

@Injectable()
export class AuthOnly implements CanActivate {
    async canActivate(
        context: ExecutionContext,
    ): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        if (!request.auth) {
            throw new UnauthorizedException();
        }

        return true;
    }
}

@Injectable()
export class GuestOnly implements CanActivate {
    async canActivate(
        context: ExecutionContext,
    ): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        if (request.auth) {
            throw new ForbiddenException();
        }

        return true;
    }
}
