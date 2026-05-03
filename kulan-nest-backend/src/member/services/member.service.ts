import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/database/entities/user.entity';
import { MemberProfile } from 'src/database/entities/member-profile.entity';
import { FindOptionsWhere, Repository } from 'typeorm';
import { CreateMemberDto } from '../dto/create-member.dto';
import { UpdateMemberDto } from '../dto/update-member.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class MemberService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(MemberProfile)
    private profileRepository: Repository<MemberProfile>,
    private configService: ConfigService,
  ) {}

  // member.controller.ts

  async findAll(): Promise<Omit<User, 'password'>[]> {
    const users = await this.userRepository.find();
    return this.toSafeUsers(users);
  }

  async findOne(id: number): Promise<Omit<User, 'password'>> {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.toSafeUser(user);
  }

  async register(
    createMemberDto: CreateMemberDto,
  ): Promise<Omit<User, 'password'>> {
    const emailNorm = createMemberDto.email.trim().toLowerCase();
    const existingUser = await this.userRepository.findOne({
      where: [{ email: emailNorm }, { phone: createMemberDto.phone }],
    });

    if (existingUser) {
      if (existingUser.email.toLowerCase() === emailNorm) {
        throw new BadRequestException('Email already exists');
      }

      if (existingUser.phone === createMemberDto.phone) {
        throw new BadRequestException('Phone already exists');
      }
    }

    const hashedPassword = await bcrypt.hash(
      createMemberDto.password,
      this.getSaltRounds(),
    );

    const user = this.userRepository.create({
      fullName: createMemberDto.full_name,
      email: emailNorm,
      password: hashedPassword,
      phone: createMemberDto.phone,
      roleId: 1, // 🔥 member role
      status: 'active',
    });
    const savedUser = await this.userRepository.save(user);

    const profile = this.profileRepository.create({
      userId: savedUser.id,
      profileCompleted: false,
    });
    await this.profileRepository.save(profile);

    return this.toSafeUser(savedUser);
  }

  async update(
    id: number,
    dto: UpdateMemberDto,
  ): Promise<Omit<User, 'password'>> {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // 🔍 Check email / phone uniqueness
    if (dto.email || dto.phone) {
      const conditions: FindOptionsWhere<User>[] = [];

      if (dto.email) conditions.push({ email: dto.email });
      if (dto.phone) conditions.push({ phone: dto.phone });

      const existingUser = await this.userRepository.findOne({
        where: conditions,
      });

      if (existingUser && existingUser.id !== id) {
        if (dto.email && existingUser.email === dto.email) {
          throw new BadRequestException('Email already exists');
        }

        if (dto.phone && existingUser.phone === dto.phone) {
          throw new BadRequestException('Phone already exists');
        }
      }
    }

    // 🔐 Password
    if (dto.password && dto.password.trim() !== '') {
      user.password = await bcrypt.hash(dto.password, this.getSaltRounds());
    }

    // 🔄 Update fields
    user.fullName = dto.full_name ?? user.fullName;

    if (dto.email) user.email = dto.email.toLowerCase().trim();
    if (dto.phone) user.phone = dto.phone.trim();

    const savedUser = await this.userRepository.save(user);
    return this.toSafeUser(savedUser);
  }

  async remove(id: number) {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.userRepository.remove(user);

    return { message: 'User deleted successfully' };
  }

  private getSaltRounds(): number {
    const configured = this.configService.get<string>(
      'BCRYPT_SALT_ROUNDS',
      '12',
    );
    const parsed = Number(configured);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 12;
  }

  private toSafeUser(user: User): Omit<User, 'password'> {
    const { password, ...safeUser } = user;
    return safeUser;
  }

  private toSafeUsers(users: User[]): Omit<User, 'password'>[] {
    return users.map((user) => this.toSafeUser(user));
  }
}
