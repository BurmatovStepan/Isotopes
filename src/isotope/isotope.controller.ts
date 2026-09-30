import {
    Body,
    Controller,
    Delete,
    Get,
    Injectable,
    NotFoundException,
    Param,
    ParseEnumPipe,
    ParseIntPipe,
    Post,
    Put,
    Query,
    UploadedFiles,
    UseInterceptors
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';

import { IsotopeDraftDTO } from './dto/create-isotope-draft.dto.js';
import { IsotopePublishDTO } from './dto/publish-isotope.dto.js';
import { IsotopeService, LikeAction } from './isotope.service.js';

@Injectable()
export class AuthService {
    getCurrentUserId(): number {
        return 1;
    }
}

@Controller('isotopes')
export class IsotopeController {
    constructor(
        private readonly isotopeService: IsotopeService,

        private readonly authService: AuthService,
    ) { }

    @Get('')
    async fetchPublished(@Query('maxHalfLifeExponent', ParseIntPipe) maxHalfLifeExponent?: number) {
        let limit = undefined;

        if (maxHalfLifeExponent !== undefined && maxHalfLifeExponent >= 0) {
            limit = 10n ** BigInt(maxHalfLifeExponent);
        }

        const isotopes = await this.isotopeService.getPublished(limit, this.authService.getCurrentUserId());

        return {
            isotopes,
            maxHalfLifeExponent:
                maxHalfLifeExponent !== undefined
                    ? maxHalfLifeExponent
                    : -1,
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
            video?: Express.Multer.File[];
            image?: Express.Multer.File[];
        },
    ) {
        const videoFile = files.video?.[0];
        const imageFile = files.image?.[0];

        return await this.isotopeService.createDraft(
            this.authService.getCurrentUserId(),
            dto,
            videoFile,
            imageFile,
        );
    }

    @Delete('/:id')
    async deletePublished(@Param('id', ParseIntPipe) id: number) {
        return await this.isotopeService.deletePublished(this.authService.getCurrentUserId(), id);
    }

    @Get('/draft')
    async fetchDraft() {
        return await this.isotopeService.getDraft(this.authService.getCurrentUserId());
    }

    @Put('/draft')
    async publishDraft(@Body() dto: IsotopePublishDTO) {
        return await this.isotopeService.publishDraft(this.authService.getCurrentUserId(), dto);
    }

    @Post('/:id/like/:action')
    async addLike(
        @Param('id', ParseIntPipe) id: number,
        @Param('action', new ParseEnumPipe(LikeAction)) action: LikeAction,
    ) {
        return await this.isotopeService.like(this.authService.getCurrentUserId(), id, action);
    }
}

@Controller('isotopes/feed')
export class IsotopeFeedController {
    constructor(
        private readonly isotopeService: IsotopeService,

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
