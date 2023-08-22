import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entity/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class UserService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>
    ) {}

    async findAll() {
        return;
    }

    async findOne(id: string) {
        return;
    }

    async create(email: string, password: string) {
        const user = this.userRepository.create({ email, password});
        await this.userRepository.save(user);
        return user;
    }

    async findOneByEmail(email: string) {
        const user = await this.userRepository.findOneBy({
            email
        })
        return user;
    }
}
