import { InternalServerErrorException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

type Parser<T> = (value: string) => T;

export function getEnv(
    config: ConfigService,
    key: string,
): string;

export function getEnv(
    config: ConfigService,
    key: string,
    defaultValue: string,
): string;

export function getEnv<T>(
    config: ConfigService,
    key: string,
    parse: Parser<T>,
): T;

export function getEnv<T>(
    config: ConfigService,
    key: string,
    parse: Parser<T>,
    defaultValue: T,
): T;

export function getEnv<T>(
    config: ConfigService,
    key: string,
    parseOrDefault?: Parser<T> | string,
    parserDefaultValue?: T,
): string | T {
    const isParser = typeof parseOrDefault === "function";

    const parse = isParser
        ? parseOrDefault
        : undefined;

    const defaultValue = isParser
        ? parserDefaultValue
        : parseOrDefault;

    const rawValue = config.get<string>(key)?.trim();

    if (!rawValue) {
        if (defaultValue !== undefined) {
            return defaultValue;
        }

        throw new InternalServerErrorException(`Ошибка при чтении .env: отсутствует значение "${key}"`,);
    }

    return parse ? parse(rawValue) : rawValue;
}


export function parseBoolean(value: string) {
    switch (value.toLowerCase()) {
        case 'true':
            return true;

        case 'false':
            return false;

        default:
            throw new InternalServerErrorException(`Значение "${value}" не является boolean`);
    }
}

export function parseInteger(value: string) {
    if (!/^-?\d+$/.test(value)) {
        throw new InternalServerErrorException(`Значение "${value}" не является целым числом`)
    }

    return Number(value);
}
