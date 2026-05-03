import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateOrganizerDto } from '../dto/create-organizer.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/database/entities/user.entity';
import { OrganizerProfile } from 'src/database/entities/organizer-profile.entity';
import { OrganizerVerificationDocument } from 'src/database/entities/organizer-verification-document.entity';
import { Event } from 'src/database/entities/event.entity';
import { EventRegistration } from 'src/database/entities/event-registration.entity';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class OrganizerService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(OrganizerProfile)
    private organizerProfileRepository: Repository<OrganizerProfile>,
    @InjectRepository(OrganizerVerificationDocument)
    private organizerDocumentRepository: Repository<OrganizerVerificationDocument>,
    @InjectRepository(Event)
    private eventRepository: Repository<Event>,
    @InjectRepository(EventRegistration)
    private eventRegistrationRepository: Repository<EventRegistration>,
    private configService: ConfigService,
    private jwtService: JwtService,
  ) {}

  async register(dto: CreateOrganizerDto) {
    const existingUser = await this.userRepository.findOne({
      where: [{ email: dto.email }, { phone: dto.phone }],
    });

    if (existingUser) {
      throw new BadRequestException('Email or phone already exists');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 12);

    const organizer = this.userRepository.create({
      fullName: dto.full_name,
      email: dto.email.toLowerCase(),
      password: hashedPassword,
      phone: dto.phone,
      location: dto.location,
      roleId: 2, // 🧑‍💼 ORGANIZER
      status: 'pending', // ⏳ WAITING APPROVAL
    });

    const saved = await this.userRepository.save(organizer);

    const organizerProfile = this.organizerProfileRepository.create({
      userId: saved.id,
      organizationName: '',
      organizationDescription: '',
      website: '',
      verificationStatus: 'pending',
      createdAt: new Date(),
    });
    await this.organizerProfileRepository.save(organizerProfile);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...safe } = saved;
    return safe;
  }

  async login(email: string, password: string) {
    const user = await this.userRepository.findOne({
      where: { email: email.toLowerCase() },
      select: ['id', 'roleId', 'password', 'status', 'email'],
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.roleId !== 2) {
      throw new UnauthorizedException(
        'This account is not registered as an organizer. Use member login instead.',
      );
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const payload = {
      sub: user.id,
      role: user.roleId,
      email: user.email,
      status: user.status,
    };

    const organizerProfile = await this.organizerProfileRepository.findOne({
      where: { userId: user.id },
    });

    return {
      access_token: this.jwtService.sign(payload),
      organizerStatus: organizerProfile?.verificationStatus ?? 'pending',
      rejectionReason: organizerProfile?.rejectionReason ?? null,
    };
  }

  async getStatus(userId: number) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'roleId', 'status', 'email', 'fullName'],
    });

    if (!user || user.roleId !== 2) {
      throw new NotFoundException('Organizer profile not found');
    }

    const organizerProfile = await this.organizerProfileRepository.findOne({
      where: { userId },
    });

    const document = await this.organizerDocumentRepository.findOne({
      where: { organizerId: userId },
      order: { id: 'DESC' },
    });

    return {
      userId: user.id,
      email: user.email,
      fullName: user.fullName,
      userStatus: user.status,
      verificationStatus: organizerProfile?.verificationStatus ?? 'pending',
      rejectionReason: organizerProfile?.rejectionReason ?? null,
      organizationName: organizerProfile?.organizationName ?? null,
      organizationDescription: organizerProfile?.organizationDescription ?? null,
      hasDocument: !!document,
      documentStatus: document?.status ?? null,
    };
  }

  async getMyEvents(userId: number, status?: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user || user.roleId !== 2) {
      throw new NotFoundException('Organizer not found');
    }

    const where: Record<string, unknown> = { organizerId: userId };
    if (status) {
      where.status = status;
    }

    const events = await this.eventRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });

    const registrationCountByEventId = new Map<number, number>();
    if (events.length > 0) {
      const ids = events.map((e) => e.id);
      const rows = await this.eventRegistrationRepository
        .createQueryBuilder('reg')
        .select('reg.eventId', 'eventId')
        .addSelect('COUNT(reg.id)', 'cnt')
        .where('reg.eventId IN (:...ids)', { ids })
        .groupBy('reg.eventId')
        .getRawMany<{ eventId: number; cnt: string }>();
      for (const row of rows) {
        registrationCountByEventId.set(Number(row.eventId), Number(row.cnt));
      }
    }

    return events.map((event) => ({
      id: event.id,
      title: event.title,
      description: event.description,
      status: event.status,
      startsAt: event.startDatetime,
      endsAt: event.endDatetime,
      locationName: event.locationName,
      capacity: event.capacity,
      totalPrice: event.totalPrice,
      isPhysical: event.isPhysical,
      coverImage: event.coverImage ?? null,
      registrationCount: registrationCountByEventId.get(event.id) ?? 0,
    }));
  }
}
