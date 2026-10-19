import { IsNotEmpty, IsString } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';

export class IsotopeDraftDTO {
    @ApiProperty({ example: 'Уран-235', description: 'Название изотопа' })
    @IsNotEmpty()
    @IsString()
    name: string;
}
