import {
    Body,
    Controller,
    Delete,
    Get,
    NotFoundException,
    Param,
    ParseEnumPipe,
    ParseIntPipe,
    Post,
    Put,
    Query,
    Req,
    UploadedFiles,
    UseGuards,
    UseInterceptors
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';

import { AuthReq } from '../auth/auth.deco.js';
import { AuthOnly } from '../auth/auth.guards.js';
import { IsotopeDraftDTO } from './dto/create-isotope-draft.dto.js';
import { IsotopePublishDTO } from './dto/publish-isotope.dto.js';
import { IsotopeService, LikeAction } from './isotope.service.js';

import type { AppRequest, AuthRequest } from '../auth/auth.deco.js';

@Controller('isotopes')
export class IsotopeController {
    constructor(
        private readonly isotopeService: IsotopeService,
    ) { }

    @Get('')
    async fetchPublished(
        @Req() req: AppRequest,
        @Query('maxHalfLifeExponent', new ParseIntPipe({ optional: true })) maxHalfLifeExponent?: number,
    ) {
        let limit = undefined;

        if (maxHalfLifeExponent !== undefined && maxHalfLifeExponent >= 0) {
            limit = 10n ** BigInt(maxHalfLifeExponent);
        }

        const isotopes = await this.isotopeService.getPublished(limit, req.userId);

        return {
            isotopes,
            maxHalfLifeExponent:
                maxHalfLifeExponent !== undefined
                    ? maxHalfLifeExponent
                    : -1,
        }
    }

    @UseGuards(AuthOnly)
    @Get('/draft')
    async fetchDraft(
        @AuthReq() req: AuthRequest,
    ) {
        return await this.isotopeService.getDraft(req.userId);
    }

    @Get('/:id')
    async fetchById(
        @Req() req: AppRequest,
        @Param('id', ParseIntPipe) id: number,
        @Query('next') next?: string
    ) {
        const currentUserId = req.auth ? req.userId : undefined;

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

    @UseGuards(AuthOnly)
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
        @AuthReq() req: AuthRequest,
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
            req.userId,
            dto,
            videoFile,
            imageFile,
        );
    }

    @UseGuards(AuthOnly)
    @Delete('/:id')
    async deletePublished(
        @AuthReq() req: AuthRequest,
        @Param('id', ParseIntPipe) id: number
    ) {
        return await this.isotopeService.deletePublished(req.userId, id);
    }

    @UseGuards(AuthOnly)
    @Put('/draft')
    async publishDraft(
        @AuthReq() req: AuthRequest,
        @Body() dto: IsotopePublishDTO
    ) {
        return await this.isotopeService.publishDraft(req.userId, dto);
    }

    @UseGuards(AuthOnly)
    @Post('/:id/like/:action')
    async addLike(
        @AuthReq() req: AuthRequest,
        @Param('id', ParseIntPipe) id: number,
        @Param('action', new ParseEnumPipe(LikeAction)) action: LikeAction,
    ) {
        return await this.isotopeService.like(req.userId, id, action);
    }
}
