import {
    Body,
    Controller,
    Get,
    HttpStatus,
    NotFoundException,
    Param,
    ParseIntPipe,
    Post,
    Query,
    Redirect,
    Render,
    Res
} from '@nestjs/common';

import { IsotopePublishDTO, IsotopesService as IsotopeService } from './isotopes.service.js';

import type { Response } from 'express';

const CURRENT_USER_ID = 2;

export const MINIO_URL = 'http://localhost:9000/isotopes';

@Controller('isotopes/home')
export class IsotopesHomeController {
    constructor(private readonly isotopeService: IsotopeService) { }

    @Get('')
    @Render('home')
    async fetchFirst() {
        const isotopeView = await this.isotopeService.getFirstPublished(CURRENT_USER_ID);

        if (!isotopeView) {
            throw new NotFoundException();
        }

        return isotopeView;
    }

    @Get(':id')
    @Render('home')
    async fetchById(@Param('id', ParseIntPipe) id: number, @Query('next') next?: string) {
        let isotopeView;

        if (next === 'true') {
            isotopeView = await this.isotopeService.getNextPublished(id, CURRENT_USER_ID);

            if (!isotopeView) {
                isotopeView = await this.isotopeService.getFirstPublished(CURRENT_USER_ID);
            }

        } else {
            isotopeView = await this.isotopeService.getPublishedById(id, CURRENT_USER_ID);
        }

        if (!isotopeView) {
            throw new NotFoundException();
        }

        return isotopeView;
    }
}


@Controller('isotopes/add')
export class IsotopesAddController {
    constructor(private readonly isotopeService: IsotopeService) { }

    @Get()
    async fetchDraft(@Res() res: Response) {
        const draft = await this.isotopeService.getDraft(CURRENT_USER_ID);

        if (draft) {
            return res.render('publish', draft);
        }

        return res.render('add');
    }
}

@Controller('isotopes/draft')
export class IsotopesDraftController {
    constructor(private readonly isotopeService: IsotopeService) { }

    @Post()
    @Redirect('/isotopes/add', HttpStatus.SEE_OTHER)
    async createDraft() {
        await this.isotopeService.createDraft(CURRENT_USER_ID);
    }
}

@Controller('isotopes/:id/publish')
export class IsotopesPublishController {
    constructor(private readonly isotopeService: IsotopeService) { }

    @Post()
    @Redirect('/isotopes/feed', HttpStatus.SEE_OTHER)
    async publishDraft(@Param('id', ParseIntPipe) id: number, @Body() dto: IsotopePublishDTO) {
        await this.isotopeService.publishDraft(id, dto);
    }
}

@Controller('isotopes/feed')
export class IsotopesFeedController {
    constructor(private readonly isotopeService: IsotopeService) { }

    @Get()
    @Render('feed')
    async fetchFeed(@Query('maxHalfLifeExponent') maxHalfLifeExponent?: string) {
        let limit = undefined;

        if (maxHalfLifeExponent && maxHalfLifeExponent !== "-1") {
            limit = 10n ** BigInt(maxHalfLifeExponent);
        }

        const isotopes = await this.isotopeService.getPublished(limit, CURRENT_USER_ID);

        return {
            isotopes,
            maxHalfLifeExponent: maxHalfLifeExponent || '-1',
        }
    }
}

@Controller('isotopes/:id/delete')
export class IsotopesDeleteController {
    constructor(private readonly isotopeService: IsotopeService) { }

    @Post()
    @Redirect('/isotopes/feed', HttpStatus.SEE_OTHER)
    async publishDraft(@Param('id', ParseIntPipe) id: number) {
        await this.isotopeService.deletePublished(id, CURRENT_USER_ID);
    }
}
