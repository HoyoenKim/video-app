import { Body, Controller, Get, HttpStatus, Param, ParseFilePipeBuilder, Post, Query, Res, StreamableFile, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiBearerAuth, ApiConsumes, ApiExtraModels, ApiTags } from '@nestjs/swagger';
import { VideoService } from './video.service';
import { CreateVideoReqDto, FindVideoReqDto } from './dto/req.dto';
import { PageReqDto } from 'src/common/dto/req.dto';
import { ApiGetItemsResponse, ApiGetResponse, ApiPostResponse } from 'src/common/decorator/swagger.decorator';
import { CreateVideoResDto, FindVideoResDto } from './dto/res.dto';
import { PageResDto } from 'src/common/dto/res.dto';
import { ThrottlerBehindProxyGuard } from 'src/common/guard/throttler-behind-proxy.guard';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import { User, UserAfterAuth } from 'src/common/decorator/user.decorator';
import { CreateVideoCommand } from './command/create-video.command';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { FindVideosQuery } from './query/find-videos.query';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';

@ApiTags('Video')
@ApiExtraModels(FindVideoReqDto, PageReqDto, CreateVideoReqDto, FindVideoResDto, PageResDto)
@UseGuards(ThrottlerBehindProxyGuard)
@Controller('api/video')
export class VideoController {
    constructor(
        private readonly videoService: VideoService,
        private readonly commandBus: CommandBus, //create
        private readonly queryBus: QueryBus, // read
    ) {}

    @ApiBearerAuth()
    @ApiConsumes('multipart/form-data')
    @ApiPostResponse(CreateVideoResDto)
    @ApiGetItemsResponse(FindVideoResDto)
    @UseInterceptors(FileInterceptor('video'))
    @Post()
    async upload(
        @UploadedFile(
            new ParseFilePipeBuilder()
                .addFileTypeValidator({
                    fileType: 'mp4',
                })
                .addMaxSizeValidator({
                    maxSize: 5 * 1024 * 1024
                })
                .build({
                    errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
                })
        ) file: Express.Multer.File,
        @Body() createVideoReqDto: CreateVideoReqDto, @User() user: UserAfterAuth): Promise<CreateVideoResDto> {
        const { mimetype, originalname, buffer } = file;
        const extension = originalname.split('.')[1];
        const { title } = createVideoReqDto;

        const command = new CreateVideoCommand(user.id, title, mimetype, extension, buffer);
        const { id } = await this.commandBus.execute(command);
        return { id, title }
    }

    @ApiBearerAuth()
    @SkipThrottle()
    @Get()
    async findAll(@Query() pageReqDto: PageReqDto): Promise<FindVideoResDto[]> {
        const { page, size } = pageReqDto;
        const findvideosQuery = new FindVideosQuery(page, size);
        const videos = await this.queryBus.execute(findvideosQuery);
        return videos.map(({ id, title, user }) => {
            return {
                id,
                title,
                user: {
                    id: user.id,
                    email: user.email,
                }
            }
        });
    }

    @ApiBearerAuth()
    @ApiGetResponse(FindVideoResDto)
    @Get(':id')
    async findOne(@Param() findVideoReqDto: FindVideoReqDto): Promise<FindVideoResDto> {
        const { id } = findVideoReqDto;
        const video = await this.videoService.findOne(id);
        const { title, user } = video;
        return {
            id,
            title,
            user: {
                id: user.id,
                email: user.email
            }
        }
    }

    @ApiBearerAuth()
    @Throttle(3, 60)
    @Get(':id/download')
    async download(
        @Param() findVideoReqDto: FindVideoReqDto,
        @Res({ passthrough: true}) res: Response
    ) {
        const { id } = findVideoReqDto;
        const { stream, mimetype, size } = await this.videoService.download(id);

        res.set({
            "Content-Length": size,
            "content-type": mimetype,
            "Content-Disposition": "attachment;",
        });
        return new StreamableFile(stream);
    }
}
