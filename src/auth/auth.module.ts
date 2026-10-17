import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';

import { SessionModule } from '../session/session.module.js';
import { UserModule } from '../user/user.module.js';
import { AuthController } from './auth.controller.js';
import { AuthOnly, GuestOnly } from './auth.guards.js';
import { AuthMiddleware } from './auth.middleware.js';
import { AuthService } from './auth.service.js';

@Module({
    imports: [SessionModule, UserModule],
    providers: [AuthService, AuthOnly, GuestOnly],
    controllers: [AuthController],
    exports: [AuthOnly, GuestOnly],
})
export class AuthModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(AuthMiddleware).forRoutes('*path');
    }
}
