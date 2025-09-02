import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  @Get('status')
  getStatus() {
    return { message: 'Auth module ready for implementation' };
  }
}