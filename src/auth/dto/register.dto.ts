import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RegisterDTO {
    @ApiProperty({ example: 'ivan', description: 'Логин пользователя' })
    @IsNotEmpty()
    @IsString()
    login: string;

    @ApiProperty({ example: 'secret123', description: 'Пароль' })
    @IsNotEmpty()
    @IsString()
    password: string;
}
