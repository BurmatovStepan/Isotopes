import { IsNotEmpty, IsString } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';

export class LoginDTO {
    @ApiProperty({ example: 'ivan', description: 'Логин пользователя' })
    @IsNotEmpty()
    @IsString()
    login: string;

    @ApiProperty({ example: 'secret123', description: 'Пароль' })
    @IsNotEmpty()
    @IsString()
    password: string;
}
