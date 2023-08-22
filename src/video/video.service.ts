import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Video } from './entity/video.entity';
import { Repository } from 'typeorm';

@Injectable()
export class VideoService {
    constructor(
        @InjectRepository(Video)
        private readonly videoRepository: Repository<Video>
    ) {}

    async create() {
        return;
    }

    async findAll() {
        return;
    }

    async findOne(id: string) {
        return;
    }

    async download(id: string) {
        return;
    }
}
