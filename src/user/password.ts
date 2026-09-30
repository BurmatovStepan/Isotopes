import { InternalServerErrorException } from '@nestjs/common';
import { BinaryLike, randomBytes, scrypt, ScryptOptions, timingSafeEqual } from 'crypto';
import { promisify } from 'util';

export class Password {
    private static readonly scryptAsync: (
        password: BinaryLike,
        salt: BinaryLike,
        keylen: number,
        options?: ScryptOptions,
    ) => Promise<Buffer> = promisify(scrypt);

    static async hashPassword(password: string) {
        const salt = randomBytes(16).toString("hex");

        try {
            const passwordBuffer = await this.scryptAsync(password, salt, 64);
            return `${passwordBuffer.toString('hex')}.${salt}`

        } catch {
            throw new InternalServerErrorException();
        }
    }

    static async comparePassword(
        storedPassword: string,
        suppliedPassword: string
    ): Promise<boolean> {
        const parts = storedPassword.split(".");

        if (parts.length !== 2) {
            return false;
        }

        const [hashedPassword, salt] = parts;
        const hashedPasswordBuffer = Buffer.from(hashedPassword, "hex");

        if (hashedPasswordBuffer.length !== 64) {
            return false;
        }

        try {
            const suppliedPasswordBuffer = await this.scryptAsync(suppliedPassword, salt, 64);
            return hashedPasswordBuffer.length === suppliedPasswordBuffer.length
                && timingSafeEqual(hashedPasswordBuffer, suppliedPasswordBuffer);

        } catch {
            return false;
        }
    }
}
