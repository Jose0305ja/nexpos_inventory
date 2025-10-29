import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { IS_PUBLIC_KEY } from './public.decorator';
import { createHmac } from 'crypto';

export interface AuthenticatedUser {
  userId: string;
  role: 'admin' | 'employee';
  companyId: string;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly configService: ConfigService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    if (!authHeader) {
      throw new UnauthorizedException({ message: 'Token no proporcionado' });
    }

    const [type, token] = authHeader.split(' ');

    if (type !== 'Bearer' || !token) {
      throw new UnauthorizedException({ message: 'Formato de token inválido' });
    }

    try {
      const secret = this.configService.get<string>('JWT_SECRET');
      const payload = this.verifyToken(token, secret || '');

      if (!payload.companyId || !payload.role || !payload.userId) {
        throw new ForbiddenException({ message: 'Token inválido' });
      }

      request.user = payload;
      return true;
    } catch (error) {
      throw new UnauthorizedException({ message: 'Token inválido' });
    }
  }

  private verifyToken(token: string, secret: string): AuthenticatedUser {
    if (!secret) {
      throw new UnauthorizedException({ message: 'Token inválido' });
    }

    const segments = token.split('.');

    if (segments.length !== 3) {
      throw new UnauthorizedException({ message: 'Token inválido' });
    }

    const [headerSegment, payloadSegment, signature] = segments;
    const data = `${headerSegment}.${payloadSegment}`;
    const expectedSignature = createHmac('sha256', secret)
      .update(data)
      .digest('base64url');

    if (expectedSignature !== signature) {
      throw new UnauthorizedException({ message: 'Token inválido' });
    }

    let payload: AuthenticatedUser & { exp?: number };

    try {
      const payloadString = Buffer.from(payloadSegment, 'base64url').toString('utf8');
      payload = JSON.parse(payloadString);
    } catch (error) {
      throw new UnauthorizedException({ message: 'Token inválido' });
    }

    if (payload.exp && Date.now() >= payload.exp * 1000) {
      throw new UnauthorizedException({ message: 'Token expirado' });
    }

    return payload;
  }
}
