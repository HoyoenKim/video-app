import { ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsInt } from "class-validator";

export class PageReqDto {
    @ApiPropertyOptional({
        description: 'Number of page. Default = 1'
    })
    @Transform(param => Number(param.value))
    @IsInt()
    page?: number = 1;

    @ApiPropertyOptional({
        description: 'Number of data by page. Default = 20'
    })
    @Transform(param => Number(param.value))
    @IsInt()
    size?: number = 20;
}