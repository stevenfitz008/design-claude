import { Injectable, ConflictException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { JwtAuthService } from './jwt.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto, UserResponseDto } from './dto/auth-response.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly jwtService: JwtAuthService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    const { email, password, name, avatar } = registerDto;

    // Check if user already exists
    const existingUser = await this.prismaService.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user with default preferences and limits
    const user = await this.prismaService.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        name: name.trim(),
        avatar: avatar?.trim(),
        preferences: {
          theme: 'light',
          language: 'en',
          autoSave: true,
          showGrid: true,
          snapToGrid: true,
          showGuides: true,
          snapToGuides: true,
          defaultCanvasSize: { width: 1920, height: 1080 }
        },
        limits: {
          maxProjects: 10,
          maxStorageSize: 104857600, // 100MB
          maxExportsPerMonth: 50,
          hasAIFeatures: false,
          hasAdvancedExport: false,
          hasCollaboration: false
        }
      },
    });

    // Generate token pair
    const tokens = await this.jwtService.generateTokenPair(user);

    // Update last login
    await this.prismaService.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return {
      user: this.formatUserResponse(user),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt: tokens.expiresAt,
      tokenType: 'Bearer',
    };
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const { email, password } = loginDto;

    // Find user
    const user = await this.prismaService.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Generate token pair
    const tokens = await this.jwtService.generateTokenPair(user);

    // Update last login
    await this.prismaService.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return {
      user: this.formatUserResponse(user),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt: tokens.expiresAt,
      tokenType: 'Bearer',
    };
  }

  async refreshToken(refreshToken: string): Promise<{ accessToken: string; expiresAt: number }> {
    if (!refreshToken) {
      throw new BadRequestException('Refresh token is required');
    }

    try {
      return await this.jwtService.refreshAccessToken(refreshToken);
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async logout(refreshToken: string): Promise<{ message: string }> {
    if (!refreshToken) {
      throw new BadRequestException('Refresh token is required');
    }

    try {
      await this.jwtService.revokeToken(refreshToken, 'refresh');
      return { message: 'Successfully logged out' };
    } catch (error) {
      // Even if token is invalid, consider logout successful
      return { message: 'Successfully logged out' };
    }
  }

  async logoutAll(userId: string): Promise<{ message: string }> {
    await this.jwtService.revokeAllUserTokens(userId);
    return { message: 'Successfully logged out from all devices' };
  }

  async validateUser(userId: string): Promise<UserResponseDto> {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return this.formatUserResponse(user);
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<{ message: string }> {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    // Update password and revoke all tokens
    await this.prismaService.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword },
    });

    // Revoke all user tokens to force re-login
    await this.jwtService.revokeAllUserTokens(userId);

    return { message: 'Password changed successfully. Please log in again.' };
  }

  async getProfile(userId: string): Promise<UserResponseDto> {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return this.formatUserResponse(user);
  }

  async updateProfile(userId: string, updates: { name?: string; avatar?: string }): Promise<UserResponseDto> {
    const user = await this.prismaService.user.update({
      where: { id: userId },
      data: {
        ...(updates.name && { name: updates.name.trim() }),
        ...(updates.avatar && { avatar: updates.avatar.trim() }),
      },
    });

    return this.formatUserResponse(user);
  }

  private formatUserResponse(user: any): UserResponseDto {
    // Exclude password from response
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword as UserResponseDto;
  }

  // Health check
  async isHealthy(): Promise<boolean> {
    try {
      // Test database connection
      await this.prismaService.user.count();
      
      // Test JWT service
      return await this.jwtService.isHealthy();
    } catch {
      return false;
    }
  }
}