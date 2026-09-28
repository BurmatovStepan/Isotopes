import {
    Body,
    Controller,
    Delete,
    Get,
    Injectable,
    NotFoundException,
    Param,
    ParseIntPipe,
    Patch,
    Post,
    Query
} from '@nestjs/common';

import {
    IsotopeDraftDTO,
    IsotopePublishDTO,
    IsotopesService as IsotopeService
} from './isotopes.service.js';

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
        private readonly isotopeService: IsotopeService,

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
    async createDraft(@Body() dto: IsotopeDraftDTO) {
        return await this.isotopeService.createDraft(this.authService.getCurrentUserId(), dto);
    }

    @Get('/draft')
    async fetchDraft() {
        return await this.isotopeService.getDraft(this.authService.getCurrentUserId());
    }


    @Patch('/:id/publish')
    async publishDraft(@Param('id', ParseIntPipe) id: number, @Body() dto: IsotopePublishDTO) {
        return await this.isotopeService.publishDraft(this.authService.getCurrentUserId(), id, dto);
    }

    @Delete('/:id')
    async deletePublished(@Param('id', ParseIntPipe) id: number) {
        return await this.isotopeService.deletePublished(this.authService.getCurrentUserId(), id);
    }

    @Post('/:id')
    async like(@Param('id', ParseIntPipe) id: number) {
        return await this.isotopeService.like(this.authService.getCurrentUserId(), id);
    }
}

@Controller('isotopes/feed')
export class IsotopesFeedController {
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
