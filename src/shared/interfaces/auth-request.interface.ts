import type { Request } from 'express';
import { AuthenticatedUser } from '../guards/jwt-auth.guard';

export type AuthenticatedRequest = Request & { user: AuthenticatedUser };
