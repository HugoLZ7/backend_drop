import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

@Injectable()
export class WebhookSecretGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const secret = request.headers['x-webhook-secret'];

    if (secret !== this.config.getOrThrow<string>('WEBHOOK_SECRET')) {
      throw new UnauthorizedException('Webhook no autorizado');
    }
    return true;
  }
}
