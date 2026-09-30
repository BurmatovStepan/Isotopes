import { Body, Controller, Post } from "@nestjs/common";
import { UserService } from "./user.service.js";
import { RegisterDTO } from "./dto/register-user.dto.js";

@Controller('users')
export class UserController {
    constructor(
        private readonly userService: UserService,
    ) { }

    @Post('')
    async register(
        @Body() dto: RegisterDTO
    ) {
        return await this.userService.register(dto);
    }

    @Post('/auth')
    async login() {
        return {}
    }

    @Post('/logout')
    async logout() {
        return {}
    }
}
