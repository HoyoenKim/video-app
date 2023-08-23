import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { User } from 'src/user/entity/user.entity';
import { SigninResDto } from './dto/res.dto';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { RefreshToken } from './entity/refresh-token.entity';
import { Repository } from 'typeorm';

@Injectable()
export class AuthService {
    constructor(
        private readonly userService: UserService,
        private readonly jwtService: JwtService,
        @InjectRepository(RefreshToken)
        private readonly refreshTokenRepository: Repository<RefreshToken>,

    ) {}

    async signup(email: string, password: string): Promise<User> {
        const user = await this.userService.findOneByEmail(email);
        if(user) throw new BadRequestException('Email is already existed');

        const newUser = await this.userService.create(email, password);
        return newUser;
    }
    
    async signin(email: string, password: string): Promise<SigninResDto> {
        const user = await this.userService.findOneByEmail(email);
        if(!user)  throw new UnauthorizedException();

        const isMatch = password == user.password;
        if (!isMatch) throw new UnauthorizedException();

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
