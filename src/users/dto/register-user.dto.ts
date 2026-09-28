import { IsNotEmpty, IsString, IsStrongPassword } from 'class-validator';

export class RegisterDTO {
    @IsNotEmpty()
    @IsString()
    login: string;

    @IsNotEmpty()
    @IsString()
    @IsStrongPassword()
    password: string;
}
