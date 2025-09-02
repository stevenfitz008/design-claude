import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService as NestJwtService } from '@nestjs/jwt';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { PrismaService } from '../database/prisma.service';
import { SessionType } from '@prisma/client';
import * as crypto from 'crypto';

export interface JwtPayload {
  sub: string; // User ID
  email: string;
  name: string;
  plan: string;
  iat?: number;
  exp?: number;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

@Injectable()
export class JwtAuthService {
  constructor(
    private readonly jwtService: NestJwtService,
    private readonly configService: ConfigService,
    private readonly prismaService: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  async generateTokenPair(user: any): Promise<TokenPair> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      plan: user.plan,
    };

    // Generate access token
    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_SECRET'),
      expiresIn: this.configService.get('JWT_EXPIRES_IN', '24h'),
    });

    // Generate refresh token
    const refreshTokenPayload = { sub: user.id, type: 'refresh' };
    const refreshToken = this.jwtService.sign(refreshTokenPayload, {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN', '7d'),
    });

    // Calculate expiration timestamp
    const expiresAt = Date.now() + this.parseExpiresIn(this.configService.get('JWT_EXPIRES_IN', '24h'));

    // Store refresh token in database
    await this.storeRefreshToken(user.id, refreshToken);

    // Cache access token for quick validation
    await this.cacheAccessToken(user.id, accessToken);

    return {
      accessToken,
      refreshToken,
      expiresAt,
    };
  }

  async validateAccessToken(token: string): Promise<JwtPayload> {
    try {
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get('JWT_SECRET'),
      });

      // Check if token is blacklisted
      const isBlacklisted = await this.isTokenBlacklisted(token);
      if (isBlacklisted) {
        throw new UnauthorizedException('Token has been invalidated');
      }

      return payload;
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; expiresAt: number }> {
    try {
      // Verify refresh token
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      });

      // Check if refresh token exists in database
      const session = await this.prismaService.session.findFirst({
        where: {
          token: refreshToken,
          type: SessionType.REFRESH,
          isRevoked: false,
          expiresAt: { gte: new Date() },
        },
        include: { user: true },
      });

      if (!session) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Generate new access token
      const newPayload: JwtPayload = {
        sub: session.user.id,
        email: session.user.email,
        name: session.user.name,
        plan: session.user.plan,
      };

      const accessToken = this.jwtService.sign(newPayload, {
        secret: this.configService.get('JWT_SECRET'),
        expiresIn: this.configService.get('JWT_EXPIRES_IN', '24h'),
      });

      const expiresAt = Date.now() + this.parseExpiresIn(this.configService.get('JWT_EXPIRES_IN', '24h'));

      // Cache new access token
      await this.cacheAccessToken(session.user.id, accessToken);

      return { accessToken, expiresAt };
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async revokeToken(token: string, type: 'access' | 'refresh'): Promise<void> {
    if (type === 'refresh') {
      // Revoke refresh token in database
      await this.prismaService.session.updateMany({
        where: { token, type: SessionType.REFRESH },
        data: { isRevoked: true },
      });
    }

    // Add token to blacklist cache
    await this.blacklistToken(token);
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    // Revoke all refresh tokens for user
    await this.prismaService.session.updateMany({
      where: { userId, type: SessionType.REFRESH },
      data: { isRevoked: true },
    });

    // Clear user's cached access tokens
    const cacheKey = `user_tokens:${userId}`;
    await this.cacheManager.del(cacheKey);
  }

  async cleanupExpiredTokens(): Promise<number> {
    // Clean up expired sessions
    const result = await this.prismaService.session.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    });

    return result.count;
  }

  private async storeRefreshToken(userId: string, refreshToken: string): Promise<void> {
    const expiresAt = new Date(
      Date.now() + this.parseExpiresIn(this.configService.get('JWT_REFRESH_EXPIRES_IN', '7d'))
    );

    await this.prismaService.session.create({
      data: {
        userId,
        token: refreshToken,
        type: SessionType.REFRESH,
        expiresAt,
      },
    });
  }

  private async cacheAccessToken(userId: string, accessToken: string): Promise<void> {
    const cacheKey = `user_tokens:${userId}`;
    const ttl = this.parseExpiresIn(this.configService.get('JWT_EXPIRES_IN', '24h')) / 1000;
    
    // Store token hash to avoid storing sensitive data
    const tokenHash = crypto.createHash('sha256').update(accessToken).digest('hex');
    await this.cacheManager.set(cacheKey, tokenHash, ttl);
  }

  private async blacklistToken(token: string): Promise<void> {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const cacheKey = `blacklist:${tokenHash}`;
    
    // Blacklist for remaining token lifetime
    const ttl = this.parseExpiresIn(this.configService.get('JWT_EXPIRES_IN', '24h')) / 1000;
    await this.cacheManager.set(cacheKey, true, ttl);
  }

  private async isTokenBlacklisted(token: string): Promise<boolean> {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const cacheKey = `blacklist:${tokenHash}`;
    const isBlacklisted = await this.cacheManager.get(cacheKey);
    return !!isBlacklisted;
  }

  private parseExpiresIn(expiresIn: string): number {
    const unit = expiresIn.slice(-1);
    const value = parseInt(expiresIn.slice(0, -1));

    switch (unit) {
      case 's':
        return value * 1000;
      case 'm':
        return value * 60 * 1000;
      case 'h':
        return value * 60 * 60 * 1000;
      case 'd':
        return value * 24 * 60 * 60 * 1000;
      default:
        return value; // Assume milliseconds if no unit
    }
  }

  // Health check method
  async isHealthy(): Promise<boolean> {
    try {
      // Test token generation
      const testPayload = { sub: 'test', email: 'test@test.com', name: 'Test', plan: 'FREE' };
      const token = this.jwtService.sign(testPayload, {
        secret: this.configService.get('JWT_SECRET'),
        expiresIn: '1s',
      });
      
      // Test token verification
      this.jwtService.verify(token, {
        secret: this.configService.get('JWT_SECRET'),
      });
      
      return true;
    } catch {
      return false;
    }
  }
}