import { Redis } from 'ioredis';

import { Injectable, OnModuleDestroy } from '@nestjs/common';

@Injectable()
export class SessionService implements OnModuleDestroy {
    private readonly redis = new Redis({
        host: 'localhost',
        port: 6379,
    });

    constructor() {
        this.redis.on('error', (error) => {
            console.error('Redis SessionService error:', error);
        });
    }

    async onModuleDestroy() {
        this.redis.quit();
    }

    async create(sessionId: string, userId: number, ttlSec: number = 3600) {
        await this.redis.setex(`session:${sessionId}`, ttlSec, String(userId));
    }

    async getUserId(sessionId: string) {
        const userIdString = await this.redis.get(`session:${sessionId}`);
        return userIdString ? Number(userIdString) : null;
    }

    async destroy(sessionId: string) {
        await this.redis.del(`session:${sessionId}`);
    }

    async exists(sessionId: string) {
        return (await this.redis.exists(`session:${sessionId}`)) === 1;
    }
}
