import { randomUUID } from 'crypto';
import * as Minio from 'minio';

import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { getEnv, parseBoolean } from '../../config.helpers.js';

const MINIO_BUCKET_NAME = 'isotopes';

@Injectable()
export class MinioService implements OnModuleInit {
    private minioClient: Minio.Client;

    constructor(private configService: ConfigService) {
        this.minioClient = new Minio.Client({
            endPoint: getEnv(this.configService, 'MINIO_ENDPOINT', 'localhost'),
            port: getEnv(this.configService, 'MINIO_PORT', parseInt, 9000),
            useSSL: getEnv(this.configService, 'MINIO_USE_SSL', parseBoolean, false),
            accessKey: getEnv(this.configService, 'MINIO_ACCESS_KEY'),
            secretKey: getEnv(this.configService, 'MINIO_SECRET_KEY'),
        });
    }

    async onModuleInit() {
        try {
            const exists = await this.minioClient.bucketExists(MINIO_BUCKET_NAME);
            if (!exists) {
                await this.minioClient.makeBucket(MINIO_BUCKET_NAME);
                console.log(`Бакет "${MINIO_BUCKET_NAME}" создан в MinIO`);
            }
        } catch (error) {
            console.error('Ошибка при инициализации бакета MinIO:', (error as Error).message);
        }

    }

    async store(
        file: Express.Multer.File,
    ): Promise<string> {
        const extension = this.extractExtension(file);
        const objectKey = `${randomUUID()}.${extension}`;

        await this.minioClient.putObject(
            MINIO_BUCKET_NAME,
            objectKey,
            file.buffer,
            file.size,
            {
                'Content-Type': file.mimetype,
            },
        );

        return objectKey;
    }

    async remove(
        keys: string | string[],
    ): Promise<void> {
        const objectKeys = Array.isArray(keys) ? keys : [keys];

        await Promise.allSettled(
            objectKeys.map(key =>
                this.minioClient.removeObject(MINIO_BUCKET_NAME, key)
            )
        );
    }

    private extractExtension(file: Express.Multer.File) {
        const extension = file.originalname
            .split('.')
            .pop()
            ?.toLowerCase();

        if (!extension || !/^[a-z0-9]+$/.test(extension)) {
            return 'bin';
        }

        return extension;
    }
}
