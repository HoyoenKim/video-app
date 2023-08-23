import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Video } from './entity/video.entity';
import { Repository } from 'typeorm';
import { ReadStream, createReadStream } from 'fs';
import { join } from 'path';
import { stat } from 'fs/promises';

@Injectable()
export class VideoService {
    constructor(
        @InjectRepository(Video)
        private readonly videoRepository: Repository<Video>
    ) {}

    async findOne(id: string) {
        const video = await this.videoRepository.findOne({
            relations: ['user'],
            where: { id }
        });

        if(!video) {
            throw new NotFoundException();
        }

        return video;
    }

    async download(id: string): Promise<DownloadDto> {
        const video = await this.videoRepository.findOne({
            where: { id }
        });

        if(!video) {
            throw new NotFoundException();
        }

        await this.videoRepository.update({ id }, { downloadCnt: () => 'download_cnt + 1' });

        const { mimetype } = video;
        const extension = mimetype.split('/')[1];
        const videoPath = join(process.cwd(), 'video-storage', `${id}.${extension}`);
        const { size } = await stat(videoPath);
        const stream = createReadStream(videoPath);

        return {
            stream,
            mimetype,
            size,
        }
    }

    async findTop5Download() {
        const videos = await this.videoRepository.find({
            relations: ['user'],
            order: {
                downloadCnt: 'DESC',
            },
            take: 5,
        });
        return videos;
    }
}

export class DownloadDto {
    stream: ReadStream;
    mimetype: string;
    size: number;
}