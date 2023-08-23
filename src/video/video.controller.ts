import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiExtraModels, ApiTags } from '@nestjs/swagger';
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
    @ApiPostResponse(CreateVideoResDto)
    @Post()
    async upload(@Body() createVideoReqDto: CreateVideoReqDto, @User() user: UserAfterAuth): Promise<CreateVideoResDto> {
        //this.videoService.create();
        const { title, video } = createVideoReqDto;
        const command = new CreateVideoCommand(user.id, title, 'video/mp4', 'mp4', Buffer.from(''));
        const { id } = await this.commandBus.execute(command);
        return { id, title }
    }

    @ApiBearerAuth()
    @ApiGetItemsResponse(FindVideoResDto)
    @SkipThrottle()
    @Get()
    async findAll(@Query() pageReqDto: PageReqDto): Primose<FindVideoResDto[]> {
        //return this.videoService.findAll();
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
    findOne(@Param() findVideoReqDto: FindVideoReqDto) {
        const { id } = findVideoReqDto;
        return this.videoService.findOne(id);
    }

    @ApiBearerAuth()
    @Throttle(3, 60)
    @Get(':id/download')
    async download(@Param() findVideoReqDto: FindVideoReqDto) {
        const { id } = findVideoReqDto;
        return this.videoService.download(id);
    }
}
