import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import {
    IsBoolean,
    IsNotEmpty,
    IsString,
    registerDecorator,
    ValidationOptions
} from 'class-validator';

export function IsBigInt(validationOptions?: ValidationOptions) {
    return function (object: object, propertyName: string) {
        registerDecorator({
            name: 'isBigInt',
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            validator: {
                validate(value: any) {
                    return typeof value === 'bigint' && value > 0n;
                },
            },
        });
    };
}

export class IsotopePublishDTO {
    @ApiProperty({
        type: String,
        example: '31556952000000000000',
        description: 'Период полураспада в наносекундах (положительное целое)',
    })
    @Transform(({ value }) => {
        if (value === undefined || value === null || value === '') return undefined;

        try {
            return BigInt(value);
        } catch {
            return Symbol('INVALID_BIGINT');
        }
    })
    @IsNotEmpty()
    @IsBigInt({ message: 'период полураспада должен быть положительным целым числом' })
    halfLife: bigint;

    @ApiProperty({
        example: false,
        description: 'Является ли альфа-излучателем',
    })
    @Transform(({ value }) => ['on', 'true'].includes(value))
    @IsBoolean()
    isAlpha: boolean = false;

    @ApiProperty({
        example: 'Описание изотопа',
        description: 'Описание изотопа',
    })
    @IsNotEmpty()
    @IsString()
    description: string;
};
