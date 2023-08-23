import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiExtraModels, ApiTags } from '@nestjs/swagger';
import { UserService } from './user.service';
import { FindUserReqDto } from './dto/req.dto';
import { PageReqDto } from 'src/common/dto/req.dto';
import { ApiGetItemsResponse, ApiGetResponse } from 'src/common/decorator/swagger.decorator';
import { FindUserResDto } from './dto/res.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { User, UserAfterAuth } from 'src/common/decorator/user.decorator';
import { Roles } from 'src/common/decorator/role.decorator';
import { Role } from './enum/user.enum';

@ApiTags('User')
@ApiExtraModels(FindUserReqDto, PageReqDto, FindUserResDto)
@Controller('api/users')
export class UserController {
    constructor(
        private userService: UserService,
    ) {}
    
    @ApiBearerAuth()
    @ApiGetItemsResponse(FindUserResDto)
    @Roles(Role.Admin)
    @Get()
    async findAll(@Query() pageReqDto: PageReqDto): Promise<FindUserResDto[]> {
        const { page, size } = pageReqDto;
        const users = await this.userService.findAll(page, size);
        return users.map(({ id, email, createdAt}) => {
            return {
                id,
                email,
                createdAt: createdAt.toISOString(),
            };
        });
    }

    @ApiBearerAuth()
    @ApiGetResponse(FindUserResDto)
    @Get(':id')
    findOne(@Param() findUserReqDto: FindUserReqDto) {
        const { id } = findUserReqDto;
        return this.userService.findOne(id);
    }
}
