import { Controller, Get, Inject, Param } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get(':id')
  @ApiOperation({ summary: 'Get user info by id' })
  @ApiResponse({ status: 200, description: 'User info.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  async getUserInfo(@Param('id') id: number) {
    console.log('UserController - getUserInfo - id:', id);
    return await this.userService.getUserInfo(id);
  }
}
