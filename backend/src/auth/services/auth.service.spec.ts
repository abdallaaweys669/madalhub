import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { OtpService } from './otp.service';
import { MemberService } from 'src/member/services/member.service';
import { User } from 'src/database/entities/user.entity';
import { MemberProfile } from 'src/database/entities/member-profile.entity';
import { OrganizerProfile } from 'src/database/entities/organizer-profile.entity';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

describe('AuthService - Role Enforcement', () => {
  let service: AuthService;
  let userRepository: jest.Mocked<
    { findOne: jest.Mock } & Record<string, unknown>
  >;
  let profileRepository: jest.Mocked<
    { findOne: jest.Mock } & Record<string, unknown>
  >;
  let organizerProfileRepository: jest.Mocked<
    { findOne: jest.Mock } & Record<string, unknown>
  >;
  let jwtService: { sign: jest.Mock };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: { findOne: jest.fn() },
        },
        {
          provide: getRepositoryToken(MemberProfile),
          useValue: { findOne: jest.fn() },
        },
        {
          provide: getRepositoryToken(OrganizerProfile),
          useValue: { findOne: jest.fn() },
        },
        {
          provide: JwtService,
          useValue: { sign: jest.fn().mockReturnValue('test-token') },
        },
        {
          provide: OtpService,
          useValue: { sendOtp: jest.fn(), verifyOtpCode: jest.fn() },
        },
        {
          provide: MemberService,
          useValue: { register: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get(getRepositoryToken(User));
    profileRepository = module.get(getRepositoryToken(MemberProfile));
    organizerProfileRepository = module.get(
      getRepositoryToken(OrganizerProfile),
    );
    jwtService = module.get(JwtService);
  });

  describe('login - member flow', () => {
    it('should return token for valid member credentials', async () => {
      (userRepository.findOne as jest.Mock).mockResolvedValue({
        id: 1,
        email: 'member@test.com',
        roleId: 1,
        status: 'active',
        password: '$2b$12$hashed',
      });

      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (profileRepository.findOne as jest.Mock).mockResolvedValue({
        profileCompleted: true,
      });

      const result = await service.login({
        email: 'member@test.com',
        password: 'password123',
      });

      expect(result.access_token).toBe('test-token');
      expect(result.profileCompleted).toBe(true);
      expect(result.organizerStatus).toBeUndefined();
    });

    it('should reject invalid member password', async () => {
      (userRepository.findOne as jest.Mock).mockResolvedValue({
        id: 1,
        email: 'member@test.com',
        roleId: 1,
        status: 'active',
        password: '$2b$12$hashed',
      });

      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.login({ email: 'member@test.com', password: 'wrong' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('login - organizer blocked from member endpoint', () => {
    it('should throw UnauthorizedException when organizer uses member login', async () => {
      (userRepository.findOne as jest.Mock).mockResolvedValue({
        id: 5,
        email: 'organizer@test.com',
        roleId: 2,
        status: 'pending',
        password: '$2b$12$hashed',
      });

      await expect(
        service.login({ email: 'organizer@test.com', password: 'password123' }),
      ).rejects.toThrow(
        new UnauthorizedException('Use organizer login from the Welcome screen.'),
      );

      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('should not proceed to password check for organizer role', async () => {
      (userRepository.findOne as jest.Mock).mockResolvedValue({
        id: 5,
        email: 'organizer@test.com',
        roleId: 2,
        status: 'active',
        password: '$2b$12$hashed',
      });

      try {
        await service.login({
          email: 'organizer@test.com',
          password: 'anything',
        });
      } catch {
        // expected
      }

      expect(bcrypt.compare).not.toHaveBeenCalled();
    });
  });
});
