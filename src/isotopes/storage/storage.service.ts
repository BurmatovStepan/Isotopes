import { randomUUID } from 'crypto';
import * as Minio from 'minio';

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const MINIO_BUCKET_NAME = 'isotopes';

@Injectable()
export class MinioService {
    private minioClient: Minio.Client;

    constructor(private configService: ConfigService) {
        this.minioClient = new Minio.Client({
            endPoint: this.configService.get('MINIO_ENDPOINT', 'localhost'),
            port: this.configService.get<number>('MINIO_PORT', 9000),
            useSSL: this.configService.get<boolean>('MINIO_USE_SSL'),
            accessKey: this.configService.get('MINIO_ACCESS_KEY'),
            secretKey: this.configService.get('MINIO_SECRET_KEY'),
        });

        this.initializeBucket();
    }

    private async initializeBucket() {
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
        objectKey: string,
    ): Promise<void> {
        await this.minioClient.removeObject(
            MINIO_BUCKET_NAME,
            objectKey,
        );
    }

    private extractExtension(file: Express.Multer.File) {
        return file.filename.split('.').at(-1);
    }
}
