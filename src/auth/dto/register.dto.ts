import { IsNotEmpty, IsString } from 'class-validator';

export class RegisterDTO {
    @IsNotEmpty()
    @IsString()
    login: string;

    @IsNotEmpty()
    @IsString()
    password: string;
}
