import { ApiProperty } from '@nestjs/swagger';
import { UserPlan } from '@prisma/client';

export class UserResponseDto {
  @ApiProperty({ description: 'User ID' })
  id: string;

  @ApiProperty({ description: 'User email' })
  email: string;

  @ApiProperty({ description: 'User full name' })
  name: string;

  @ApiProperty({ description: 'User avatar URL', nullable: true })
  avatar: string | null;

  @ApiProperty({ description: 'User subscription plan', enum: UserPlan })
  plan: UserPlan;

  @ApiProperty({ description: 'User preferences' })
  preferences: Record<string, any>;

  @ApiProperty({ description: 'User limits' })
  limits: Record<string, any>;

  @ApiProperty({ description: 'Account creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Last login date', nullable: true })
  lastLoginAt: Date | null;
}

export class AuthResponseDto {
  @ApiProperty({ description: 'User information' })
  user: UserResponseDto;

  @ApiProperty({ description: 'JWT access token' })
  accessToken: string;

  @ApiProperty({ description: 'JWT refresh token' })
  refreshToken: string;

  @ApiProperty({ description: 'Token expiration timestamp' })
  expiresAt: number;

  @ApiProperty({ description: 'Token type', default: 'Bearer' })
  tokenType: string = 'Bearer';
}

export class RefreshResponseDto {
  @ApiProperty({ description: 'New JWT access token' })
  accessToken: string;

  @ApiProperty({ description: 'Token expiration timestamp' })
  expiresAt: number;

  @ApiProperty({ description: 'Token type', default: 'Bearer' })
  tokenType: string = 'Bearer';
}