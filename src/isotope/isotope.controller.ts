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
import {
    ApiBody,
    ApiConsumes,
    ApiCookieAuth,
    ApiOperation,
    ApiParam,
    ApiQuery,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';

import type { AppRequest, AuthRequest } from '../auth/auth.deco.js';

@ApiTags('isotopes')
@Controller('isotopes')
export class IsotopeController {
    constructor(
        private readonly isotopeService: IsotopeService,
    ) { }

    @Get('')
    @ApiOperation({ summary: 'Получить список опубликованных изотопов' })
    @ApiQuery({
        name: 'maxHalfLifeExponent',
        required: false,
        type: Number,
        description:
            'Максимальный период полураспада как 10^N наносекунд. Если не задан - без фильтра.',
        example: 20,
    })
    @ApiResponse({
        status: 200,
        description: 'Список опубликованных изотопов',
    })
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
    @ApiCookieAuth('session')
    @ApiOperation({ summary: 'Получить черновик текущего пользователя' })
    @ApiResponse({ status: 200, description: 'Черновик или null' })
    @ApiResponse({ status: 401, description: 'Требуется авторизация' })
    async fetchDraft(
        @AuthReq() req: AuthRequest,
    ) {
        return await this.isotopeService.getDraft(req.userId);
    }

    @Get('/:id')
    @ApiOperation({
        summary: 'Получить изотоп по id или следующий в ленте',
    })
    @ApiParam({ name: 'id', type: Number, description: 'ID изотопа' })
    @ApiQuery({
        name: 'next',
        required: false,
        type: String,
        enum: ['true', 'false'],
        description:
            'Если true - вернуть следующий опубликованный изотоп после id с циклическим переходом к первому',
    })
    @ApiResponse({ status: 200, description: 'Изотоп найден' })
    @ApiResponse({ status: 404, description: 'Изотоп не найден' })
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
    @ApiCookieAuth('session')
    @ApiOperation({
        summary: 'Создать черновик изотопа с изображением и видео',
    })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                name: { type: 'string', example: 'Уран-235' },
                video: { type: 'string', format: 'binary' },
                image: { type: 'string', format: 'binary' },
            },
            required: ['name'],
        },
    })
    @ApiResponse({ status: 201, description: 'Черновик создан' })
    @ApiResponse({ status: 401, description: 'Требуется авторизация' })
    @ApiResponse({ status: 409, description: 'Черновик уже существует' })
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
    @ApiCookieAuth('session')
    @ApiOperation({ summary: 'Удалить опубликованный изотоп' })
    @ApiParam({ name: 'id', type: Number, description: 'ID изотопа' })
    @ApiResponse({ status: 200, description: 'Изотоп удалён' })
    @ApiResponse({ status: 401, description: 'Требуется авторизация' })
    @ApiResponse({
        status: 404,
        description: 'Изотоп не найден или не принадлежит пользователю',
    })
    async deletePublished(
        @AuthReq() req: AuthRequest,
        @Param('id', ParseIntPipe) id: number
    ) {
        return await this.isotopeService.deletePublished(req.userId, id);
    }

    @UseGuards(AuthOnly)
    @Put('/draft')
    @ApiCookieAuth('session')
    @ApiOperation({ summary: 'Опубликовать черновик' })
    @ApiConsumes('application/json')
    @ApiBody({ type: IsotopePublishDTO })
    @ApiResponse({ status: 200, description: 'Черновик опубликован' })
    @ApiResponse({ status: 401, description: 'Требуется авторизация' })
    @ApiResponse({ status: 404, description: 'Черновик не найден' })
    async publishDraft(
        @AuthReq() req: AuthRequest,
        @Body() dto: IsotopePublishDTO
    ) {
        return await this.isotopeService.publishDraft(req.userId, dto);
    }

    @UseGuards(AuthOnly)
    @Post('/:id/like/:action')
    @ApiCookieAuth('session')
    @ApiConsumes('application/json')
    @ApiOperation({ summary: 'Поставить или убрать лайк' })
    @ApiParam({ name: 'id', type: Number, description: 'ID изотопа' })
    @ApiParam({
        name: 'action',
        enum: LikeAction,
        enumName: 'LikeAction',
        description: '0 - убрать, 1 - поставить',
    })
    @ApiResponse({ status: 201, description: 'Результат лайка' })
    @ApiResponse({ status: 401, description: 'Требуется авторизация' })
    @ApiResponse({ status: 404, description: 'Изотоп не найден' })
    async setLike(
        @AuthReq() req: AuthRequest,
        @Param('id', ParseIntPipe) id: number,
        @Param('action', new ParseEnumPipe(LikeAction)) action: LikeAction,
    ) {
        return await this.isotopeService.setLike(req.userId, id, action);
    }
}
