import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { createHmac } from 'crypto';

interface JwtPayload {
  sub?: string;
  companyId?: string;
  exp?: number;
  [key: string]: any;
}

function base64UrlDecode(input: string): string {
  input = input.replace(/-/g, '+').replace(/_/g, '/');
  const pad = input.length % 4;
  if (pad) {
    input += '='.repeat(4 - pad);
  }
  return Buffer.from(input, 'base64').toString('utf8');
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request & { user?: JwtPayload; companyId?: string }>();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Authorization header missing or malformed');
    }

    const token = authHeader.slice(7).trim();
    const payload = this.verifyToken(token);

    const bodyCompanyId = (request.body && (request.body.companyId as string)) || undefined;
    const queryCompanyId = (request.query && (request.query['companyId'] as string)) || undefined;
    const companyId = payload.companyId ?? bodyCompanyId ?? queryCompanyId;

    if (!companyId) {
      throw new UnauthorizedException('Company context not provided');
    }

    payload.companyId = companyId;

    if (request.body && !request.body.companyId) {
      request.body.companyId = companyId;
    }

    request.user = payload;
    request.companyId = companyId;

    return true;
  }

  private verifyToken(token: string): JwtPayload {
    const secret = this.configService.get<string>('JWT_SECRET', 'inventory_secret');
    const segments = token.split('.');

    if (segments.length !== 3) {
      throw new UnauthorizedException('Invalid token');
    }

    const [headerSegment, payloadSegment, signatureSegment] = segments;
    const data = `${headerSegment}.${payloadSegment}`;

    const expectedSignature = createHmac('sha256', secret).update(data).digest('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/g, '');

    if (signatureSegment !== expectedSignature) {
      throw new UnauthorizedException('Invalid token signature');
    }

    const payloadJson = base64UrlDecode(payloadSegment);
    let payload: JwtPayload;

    try {
      payload = JSON.parse(payloadJson);
    } catch (error) {
      throw new UnauthorizedException('Invalid token payload');
    }

    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      throw new UnauthorizedException('Token expired');
    }

    return payload;
  }
}
