import { BinaryLike, randomBytes, scrypt, ScryptOptions, timingSafeEqual } from 'crypto';
import { promisify } from 'util';

class PasswordHashFailedException extends Error {
    constructor() {
        super('Не удалось хешировать пароль');
        Error.captureStackTrace(this, this.constructor)
    }
}

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
            throw new PasswordHashFailedException();
        }
    }

    static async comparePassword(
        storedPassword: string,
        suppliedPassword: string
    ): Promise<boolean> {
        const [hashedPassword, salt] = storedPassword.split(".");
        const hashedPasswordBuffer = Buffer.from(hashedPassword, "hex");

        try {
            const suppliedPasswordBuffer = await this.scryptAsync(suppliedPassword, salt, 64);
            return timingSafeEqual(hashedPasswordBuffer, suppliedPasswordBuffer);

        } catch {
            throw new PasswordHashFailedException();
        }
    }
}
