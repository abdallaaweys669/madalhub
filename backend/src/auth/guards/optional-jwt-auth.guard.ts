import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/** Allows unauthenticated requests; validates JWT when `Authorization: Bearer` is present. */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context
      .switchToHttp()
      .getRequest<{ headers?: { authorization?: string } }>();
    const auth = req.headers?.authorization;
    if (!auth?.startsWith('Bearer ')) {
      return true;
    }
    return (await super.canActivate(context)) as boolean;
  }

  handleRequest<TUser = unknown>(
    err: unknown,
    user: TUser,
    _info: unknown,
    _context: ExecutionContext,
    _status?: unknown,
  ): TUser | null {
    if (err) {
      return null;
    }
    return user ?? null;
  }
}
