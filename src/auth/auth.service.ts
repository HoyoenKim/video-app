import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { User } from 'src/user/entity/user.entity';
import { SigninResDto } from './dto/res.dto';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
    constructor(
        private readonly userService: UserService,
        private readonly jwtService: JwtService
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

        return {
            accessToken: this.jwtService.sign({
                sub: user.id
            })
        }
    }
}
