import { IsNotEmpty, IsString } from 'class-validator';

export class IsotopeDraftDTO {
    @IsNotEmpty()
    @IsString()
    name: string;
}
