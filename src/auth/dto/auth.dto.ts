import { User } from '../../user/entities/user.entity.js';

export class AuthResult {
    user: Pick<User, 'id' | 'login'>;
    sessionId: string;
}
