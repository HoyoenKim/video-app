import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiExtraModels, ApiTags } from '@nestjs/swagger';
import { UserService } from './user.service';
import { FindUserReqDto } from './dto/req.dto';
import { PageReqDto } from 'src/common/dto/req.dto';
import { ApiGetItemsResponse, ApiGetResponse } from 'src/common/decorator/swagger.decorator';
import { FindUserResDto } from './dto/res.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { User, UserAfterAuth } from 'src/common/decorator/user.decorator';

@ApiTags('User')
@ApiExtraModels(FindUserReqDto, PageReqDto, FindUserResDto)
@Controller('api/users')
export class UserController {
    constructor(
        private userService: UserService,
    ) {}
    
    @ApiBearerAuth()
    @ApiGetItemsResponse(FindUserResDto)
    @Get()
    @UseGuards(JwtAuthGuard)
    findAll(@Query() pageReqDto: PageReqDto, @User() user: UserAfterAuth) {
        console.log(user);
        const { page, size } = pageReqDto;
        return this.userService.findAll();
    }

    @ApiBearerAuth()
    @ApiGetResponse(FindUserResDto)
    @Get(':id')
    findOne(@Param() findUserReqDto: FindUserReqDto) {
        const { id } = findUserReqDto;
        return this.userService.findOne(id);
    }
}
