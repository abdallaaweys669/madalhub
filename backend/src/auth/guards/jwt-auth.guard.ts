import { AuthGuard } from '@nestjs/passport';

export class JwtAuthGuard extends AuthGuard('jwt') {}

// Guard = security at the door 🚪

// If token is:

// ❌ invalid → blocked
// ✅ valid → allowed
