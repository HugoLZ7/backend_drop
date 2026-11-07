import type { Request } from 'express';

export interface JwtUser {
  userId: string;
  email: string;
}

export interface AuthRequest extends Request {
  user: JwtUser;
}
