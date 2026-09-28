import { User } from '../entities/user.entity.js';
import { UserView } from './user.view.js';

export function toUserView(user: User): UserView {
    return {
        id: user.id,
        login: user.login,
    }
}
