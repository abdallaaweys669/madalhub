import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateOrganizerDto } from '../dto/create-organizer.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/database/entities/user.entity';
import { OrganizerProfile } from 'src/database/entities/organizer-profile.entity';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
@Injectable()
export class OrganizerService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(OrganizerProfile)
    private organizerProfileRepository: Repository<OrganizerProfile>,
    private configService: ConfigService,
  ) {}

  async register(dto: CreateOrganizerDto) {
    const existingUser = await this.userRepository.findOne({
      where: [
        { email: dto.email },
        { phone: dto.phone },
      ],
    });

    if (existingUser) {
      throw new BadRequestException('Email or phone already exists');
    }

    const hashedPassword = await bcrypt.hash(
      dto.password,
      12,
    );

    const organizer = this.userRepository.create({
      fullName: dto.full_name,
      email: dto.email.toLowerCase(),
      password: hashedPassword,
      phone: dto.phone,
      location: dto.location,
      roleId: 2,            // 🧑‍💼 ORGANIZER
      status: 'pending',    // ⏳ WAITING APPROVAL
    });

    const saved = await this.userRepository.save(organizer);

    const organizerProfile = this.organizerProfileRepository.create({
      user_id: saved.id,
      organization_name: '',
      organization_description: '',
      website: '',
      verification_status: 'pending',
      created_at: new Date(),
    });
    await this.organizerProfileRepository.save(organizerProfile);

    const { password, ...safe } = saved;
    return safe;
  }
}