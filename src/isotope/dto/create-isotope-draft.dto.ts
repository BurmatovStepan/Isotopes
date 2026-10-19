import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class IsotopeDraftDTO {
    @ApiProperty({ example: 'Уран-235', description: 'Название изотопа' })
    @IsNotEmpty()
    @IsString()
    name: string;
}
