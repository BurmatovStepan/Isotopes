import {
    Body,
    Controller,
    Get,
    Injectable,
    NotFoundException,
    Param,
    ParseIntPipe,
    Patch,
    Post,
    Query,
    UploadedFiles,
    UseInterceptors
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';

import { IsotopeDraftDTO } from './dto/create-isotope-draft.dto.js';
import { IsotopePublishDTO } from './dto/publish-isotope.dto.js';
import { IsotopesService } from './isotopes.service.js';

export const MINIO_URL = 'http://localhost:9000/isotopes';

@Injectable()
export class AuthService {
    getCurrentUserId(): number {
        return 1;
    }
}

@Controller('isotopes')
export class IsotopesController {
    constructor(
        private readonly isotopeService: IsotopesService,

        private readonly authService: AuthService,
    ) { }

    @Get('')
    async fetchPublished(@Query('maxHalfLifeExponent') maxHalfLifeExponent?: string) {
        let limit = undefined;

        if (maxHalfLifeExponent && maxHalfLifeExponent !== "-1") {
            limit = 10n ** BigInt(maxHalfLifeExponent);
        }

        const isotopes = await this.isotopeService.getPublished(limit, this.authService.getCurrentUserId());

        return {
            isotopes,
            maxHalfLifeExponent: maxHalfLifeExponent || '-1',
        }
    }

    @Post('')
    @UseInterceptors(
        FileFieldsInterceptor([
            {
                name: 'video',
                maxCount: 1
            },
            {
                name: 'image',
                maxCount: 1
            },
        ]),
    )
    async createDraft(
        @Body() dto: IsotopeDraftDTO,
        @UploadedFiles()
        files: {
            videoFile?: Express.Multer.File[];
            imageFile?: Express.Multer.File[];
        },
    ) {
        const videoFile = files.videoFile?.[0];
        const imageFile = files.imageFile?.[0];

        return await this.isotopeService.createDraft(
            this.authService.getCurrentUserId(),
            dto,
            videoFile,
            imageFile,
        );
    }

    @Get('/draft')
    async fetchDraft() {
        return await this.isotopeService.getDraft(this.authService.getCurrentUserId());
    }

    @Patch('/:id/publish')
    async publishDraft(@Body() dto: IsotopePublishDTO) {
        return await this.isotopeService.publishDraft(this.authService.getCurrentUserId(), dto);
    }

    @Post('/:id/like/:action')
    async addLike(
        @Param('id', ParseIntPipe) id: number,
        @Param('action', ParseIntPipe) action: number
    ) {
        return await this.isotopeService.like(this.authService.getCurrentUserId(), id, action);
    }
}

@Controller('isotopes/feed')
export class IsotopesFeedController {
    constructor(
        private readonly isotopeService: IsotopesService,

        private readonly authService: AuthService,
    ) { }

    @Get('')
    async fetchFirstPublished() {
        return this.isotopeService.getFirstPublished(this.authService.getCurrentUserId());
    }

    @Get('/:id')
    async fetchById(@Param('id', ParseIntPipe) id: number, @Query('next') next?: string) {
        const currentUserId = this.authService.getCurrentUserId();

        let isotopeView;

        if (next === 'true') {
            isotopeView = await this.isotopeService.getNextPublished(id, currentUserId);

            if (!isotopeView) {
                isotopeView = await this.isotopeService.getFirstPublished(currentUserId);
            }

        } else {
            isotopeView = await this.isotopeService.getPublishedById(id, currentUserId);
        }

        if (!isotopeView) {
            throw new NotFoundException();
        }

        return isotopeView;
    }
}
