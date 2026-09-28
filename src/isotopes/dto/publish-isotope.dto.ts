import { Transform } from 'class-transformer';
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
                    return typeof value === 'bigint' && value >= 0n;
                },
            },
        });
    };
}

export class IsotopePublishDTO {
    @Transform(({ value }) => {
        if (value === undefined || value === null || value === '') return undefined;

        try {
            return BigInt(value);
        } catch {
            return Symbol('INVALID_BIGINT');
        }
    })
    @IsNotEmpty()
    @IsBigInt({ message: 'период полураспада должен быть положительным целым числом или 0' })
    halfLife: bigint;

    @Transform(({ value }) => value === 'on')
    @IsBoolean()
    isAlpha: boolean = false;

    @IsNotEmpty()
    @IsString()
    description: string;
};
