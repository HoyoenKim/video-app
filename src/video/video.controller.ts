import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiExtraModels, ApiTags } from '@nestjs/swagger';
import { VideoService } from './video.service';
import { CreateVideoReqDto, FindVideoReqDto } from './dto/req.dto';
import { PageReqDto } from 'src/common/dto/req.dto';
import { ApiGetItemsResponse, ApiGetResponse, ApiPostResponse } from 'src/common/decorator/swagger.decorator';
import { CreatedVideoResDto, FindVideoResDto } from './dto/res.dto';
import { PageResDto } from 'src/common/dto/res.dto';

@ApiTags('Video')
@ApiExtraModels(FindVideoReqDto, PageReqDto, CreateVideoReqDto, FindVideoResDto, PageResDto)
@Controller('api/video')
export class VideoController {
    constructor(
        private readonly videoService: VideoService
    ) {}

    @ApiBearerAuth()
    @ApiPostResponse(CreatedVideoResDto)
    @Post()
    upload(@Body() createVideoReqDto: CreateVideoReqDto) {
        this.videoService.create();
    }

    @ApiBearerAuth()
    @ApiGetItemsResponse(FindVideoResDto)
    @Get()
    findAll(@Query() pageReqDto: PageReqDto) {
        const { page, size } = pageReqDto;
        return this.videoService.findAll();
    }

    @ApiBearerAuth()
    @ApiGetResponse(FindVideoResDto)
    @Get(':id')
    findOne(@Param() findVideoReqDto: FindVideoReqDto) {
        const { id } = findVideoReqDto;
        return this.videoService.findOne(id);
    }

    @ApiBearerAuth()
    @Get(':id/download')
    async download(@Param() findVideoReqDto: FindVideoReqDto) {
        const { id } = findVideoReqDto;
        return this.videoService.download(id);
    }
}
