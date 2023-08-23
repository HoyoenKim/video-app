import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { User } from 'src/user/entity/user.entity';
import { SigninResDto, SignupResDto } from './dto/res.dto';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { RefreshToken } from './entity/refresh-token.entity';
import { DataSource, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
    constructor(
        private dataSource: DataSource,
        private readonly userService: UserService,
        private readonly jwtService: JwtService,
        @InjectRepository(RefreshToken)
        private readonly refreshTokenRepository: Repository<RefreshToken>,

    ) {}

    async signup(email: string, password: string): Promise<SignupResDto> {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        let error;
        try {
            const user = await this.userService.findOneByEmail(email);
            if(user) throw new BadRequestException('Email is already existed');

            const slatRounds = 10;
            const hash = await bcrypt.hash(password, slatRounds);
            const userEntity = queryRunner.manager.create(User, {
                email,
                password: hash
            });
            await queryRunner.manager.save(userEntity);

            const accessToken = this.generateAccessToken(userEntity.id);
            const refreshToken = this.generateRefreshToken(userEntity.id);

            const refreshTokenEntity = queryRunner.manager.create(RefreshToken, {
                user: { id: userEntity.id },
                token: refreshToken,
            });
            await queryRunner.manager.save(refreshTokenEntity);

            await queryRunner.commitTransaction();

            return {
                id: userEntity.id,
                accessToken,
                refreshToken
            };
        }
        catch (err) {
            await queryRunner.rollbackTransaction();
            error = err;
        }
        finally {
            await queryRunner.release();
            if (error) {
                throw error;
            }
        }
    }
    
    async signin(email: string, password: string): Promise<SigninResDto> {
        const user = await this.validateUser(email, password);
        const refreshToken = this.generateRefreshToken(user.id);
        await this.createRefreshToken(user.id, refreshToken);
        return {
            accessToken: this.generateAccessToken(user.id),
            refreshToken
        }
    }

    async refresh(token: string, userId: string) {
        let refreshTokenEntity = await this.refreshTokenRepository.findOneBy({
            token
        });

        if(!refreshTokenEntity) throw new UnauthorizedException();

        const accessToken = this.generateAccessToken(userId);
        const refreshToken = this.generateRefreshToken(userId);
        refreshTokenEntity.token = refreshToken
        await this.refreshTokenRepository.save(refreshTokenEntity)

        return {
            accessToken, 
            refreshToken
        }
    }

    private async validateUser(email: string, password: string): Promise<User> {
        const user = await this.userService.findOneByEmail(email);
        if(!user)  throw new UnauthorizedException();

        const slatRounds = 10;
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) throw new UnauthorizedException();

        return user;
    }

    private generateAccessToken(id: string): string {
        const payload = {
            sub: id,
            tokenType: 'access'
        }
        return this.jwtService.sign(payload, { expiresIn: '1d'});
    }

    private generateRefreshToken(id: string): string {
        const payload = {
            sub: id,
            tokenType: 'refresh'
        }
        return this.jwtService.sign(payload, { expiresIn: '30d'});
    }

    private async createRefreshToken(userId: string, refreshToken: string) {
        let refreshTokenEntity = await this.refreshTokenRepository.findOneBy({ 
            user: { id: userId } 
        });
        
        if(refreshTokenEntity) {
            refreshTokenEntity.token = refreshToken
            await this.refreshTokenRepository.save(refreshTokenEntity)
        }
        else {
            refreshTokenEntity = this.refreshTokenRepository.create({
                token: refreshToken,
                user: {
                    id: userId
                }
            })
            await this.refreshTokenRepository.save(refreshTokenEntity);
        }
        return refreshTokenEntity;
    }
}
