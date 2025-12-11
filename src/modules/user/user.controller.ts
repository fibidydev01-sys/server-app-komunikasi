import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { UserService } from './user.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { User } from '../../common/interface/user.interface';

@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}

  @Get('all')
  async getAllUsers(@CurrentUser() user: User) {
    const users = await this.userService.getAllUsers(user.id);

    return {
      message: 'Users retrieved successfully',
      users,
    };
  }

  @Get('search/:query')
  async searchUser(@Param('query') query: string) {
    const user = await this.userService.searchUser(query);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      message: 'User found',
      user,
    };
  }

  @Get(':id')
  async getUserById(@Param('id') userId: string) {
    const user = await this.userService.getUserById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      message: 'User found',
      user,
    };
  }
}
