import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { OrganizerProfile } from 'src/database/entities/organizer-profile.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class OrganizerStatusGuard implements CanActivate {
  constructor(
    @InjectRepository(OrganizerProfile)
    private organizerProfileRepository: Repository<OrganizerProfile>,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredStatuses = this.reflector.get<string[]>(
      'organizerStatuses',
      context.getHandler(),
    );

    if (!requiredStatuses) {
      return true;
    }

    const request: any = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || user.role !== 2) {
      throw new ForbiddenException('Organizer access required');
    }

    const organizerProfile = await this.organizerProfileRepository.findOne({
      where: { userId: user.userId },
    });

    const currentStatus = organizerProfile?.verificationStatus ?? 'pending';

    if (!requiredStatuses.includes(currentStatus)) {
      throw new ForbiddenException(
        `Organizer status '${currentStatus}' is not permitted. Required: ${requiredStatuses.join(', ')}`,
      );
    }

    return true;
  }
}
