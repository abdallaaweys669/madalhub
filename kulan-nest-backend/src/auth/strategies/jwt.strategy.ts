import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      // 🔥 Where to get token from request
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),

      // 🔥 Secret (same as .env)
      secretOrKey: configService.get<string>('JWT_SECRET')!,
    });
  }

  async validate(payload: any) {
    // 🔥 This becomes req.user
    return {
      userId: payload.sub,
      role: payload.role,
      status: payload.status,
    };
  }
}
