import { BadRequestException, Body, Controller, Post, Req } from '@nestjs/common';
import { ApiOkResponse, ApiExtraModels, ApiTags, getSchemaPath } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { SigninReqDto, SignupReqDto } from './dto/req.dto';
import { SignupResDto, SigninResDto } from './dto/res.dto';
import { ApiGetResponse, ApiPostResponse } from 'src/common/decorator/swagger.decorator';
import { Public } from 'src/common/decorator/public.decorator';

@ApiTags('Auth')
@ApiExtraModels(SignupResDto, SigninResDto)
@Controller('api/auth')
export class AuthController {

    constructor(
        private readonly authService: AuthService
    ) {}

    @ApiPostResponse(SignupResDto)
    @Public()
    @Post('signup')
    async signup(@Body() signupReqDto: SignupReqDto): Promise<SignupResDto> {
        const { email, password, passwordConfirm } = signupReqDto;
        if(password !== passwordConfirm) throw new BadRequestException('Password and PasswordConfirm is not matched.');
        const { id } = await this.authService.signup(email, password);
        return { id };
    }

    @ApiPostResponse(SigninResDto)
    @Public()
    @Post('signin') 
    async signin(@Body() signinReqDto: SigninReqDto): Promise<SigninResDto> {
        const { email, password } = signinReqDto;
        return this.authService.signin(email, password);
    }
}
