import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'crypto';

interface JwtPayload {
  userId: string;
  role: 'admin' | 'employee';
  companyId: string;
  exp?: number;
  [key: string]: unknown;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader: string | undefined = request.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException({ message: 'Token no proporcionado' });
    }

    const token = authHeader.split(' ')[1];
    const payload = this.verifyToken(token);

    if (!payload.userId || !payload.role || !payload.companyId) {
      throw new UnauthorizedException({ message: 'Token inválido' });
    }

    request.user = payload;
    return true;
  }

  private verifyToken(token: string): JwtPayload {
    try {
      const secret = this.configService.get<string>('JWT_SECRET');
      if (!secret) {
        throw new UnauthorizedException({ message: 'Token inválido' });
      }

      const segments = token.split('.');
      if (segments.length !== 3) {
        throw new UnauthorizedException({ message: 'Token inválido' });
      }

      const [encodedHeader, encodedPayload, signature] = segments;
      const data = `${encodedHeader}.${encodedPayload}`;

      const headerJson = Buffer.from(encodedHeader, 'base64url').toString('utf8');
      const header = JSON.parse(headerJson) as { alg?: string };

      if (!header.alg || header.alg.toUpperCase() !== 'HS256') {
        throw new UnauthorizedException({ message: 'Token inválido' });
      }

      const expectedSignature = createHmac('sha256', secret)
        .update(data)
        .digest('base64url');

      const signatureBuffer = Buffer.from(signature, 'base64url');
      const expectedBuffer = Buffer.from(expectedSignature, 'base64url');

      if (
        signatureBuffer.length !== expectedBuffer.length ||
        !timingSafeEqual(signatureBuffer, expectedBuffer)
      ) {
        throw new UnauthorizedException({ message: 'Token inválido' });
      }

      const payloadJson = Buffer.from(encodedPayload, 'base64url').toString('utf8');
      const payload = JSON.parse(payloadJson) as JwtPayload;

      if (payload.exp && payload.exp * 1000 < Date.now()) {
        throw new UnauthorizedException({ message: 'Token expirado' });
      }

      return payload;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw new UnauthorizedException({ message: 'Token inválido' });
    }
  }
}
