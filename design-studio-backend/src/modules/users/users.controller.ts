import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('users')
@Controller('users')
export class UsersController {
  @Get('status')
  getStatus() {
    return { message: 'Users module ready for implementation' };
  }
}