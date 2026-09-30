import { InternalServerErrorException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

export function getEnv<T>(
    config: ConfigService,
    key: string,
    parse: (value: string) => T,
    defaultValue?: T
) {
    const rawValue = config.get(key)?.trim();

    if (!rawValue) {
        if (defaultValue !== undefined) {
            return defaultValue
        }

        throw new InternalServerErrorException(`Ошибка при чтении .env: отсутствует значение "${key}"`,)
    }

    return parse(rawValue);
}

export function parseBool(value: string) {
    return value.toLowerCase() === 'true';
}

export function parseInt(value: string) {
    if (!/^-?\d+$/.test(value)) {
        throw new InternalServerErrorException(`Значение "${value}" не является целым числом`)
    }

    return Number(value);
}
