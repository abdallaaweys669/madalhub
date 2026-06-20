import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { OnboardingService } from '../services/onboarding.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import { InterestsDto } from '../dto/interests.dto';
import { UpdateOrganizerProfileDto } from '../dto/update-organizer-profile.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { getUploadsDir } from 'src/common/uploads-path';

@Controller('onboarding')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Get('my-interests')
  @Roles(1)
  getMyInterests(@CurrentUser() user) {
    return this.onboardingService.getMyInterests(user.userId);
  }

  @Get('interests')
  @Roles(1)
  getInterests() {
    return this.onboardingService.getInterests();
  }

  @Patch('profile')
  @Roles(1)
  updateProfile(@CurrentUser() user, @Body() dto: UpdateProfileDto) {
    return this.onboardingService.updateProfile(user.userId, dto);
  }

  @Post('interests')
  @Roles(1)
  updateInterests(@CurrentUser() user, @Body() dto: InterestsDto) {
    return this.onboardingService.updateInterests(user.userId, dto);
  }

  @Post('member/profile-image')
  @Roles(1)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: getUploadsDir(),
        filename: (req, file, cb) => {
          const uniqueName = `${Date.now()}${extname(file.originalname)}`;
          cb(null, uniqueName);
        },
      }),
    }),
  )
  updateMemberProfileImage(@CurrentUser() user, @UploadedFile() file: any) {
    return this.onboardingService.updateMemberProfileImage(user.userId, file);
  }

  // Organizer profile/document endpoints: allowed for all organizer statuses (pending, approved, rejected)
  // Status gating is enforced at the service level where needed
  @Patch('organizer')
  @Roles(2)
  updateOrganizerProfile(
    @CurrentUser() user,
    @Body() dto: UpdateOrganizerProfileDto,
  ) {
    return this.onboardingService.updateOrganizerProfile(user.userId, dto);
  }

  @Post('organizer/document')
  @Roles(2)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: getUploadsDir(),
        filename: (req, file, cb) => {
          const uniqueName = `${Date.now()}${extname(file.originalname)}`;
          cb(null, uniqueName);
        },
      }),
    }),
  )
  upsertOrganizerDocument(
    @CurrentUser() user,
    @UploadedFile() file: any,
    @Body('document_type') documentType: string,
  ) {
    return this.onboardingService.upsertOrganizerDocument(
      user.userId,
      file,
      documentType,
    );
  }

  @Post('organizer/profile-image')
  @Roles(2)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: getUploadsDir(),
        filename: (req, file, cb) => {
          const uniqueName = `${Date.now()}${extname(file.originalname)}`;
          cb(null, uniqueName);
        },
      }),
    }),
  )
  updateOrganizerProfileImage(@CurrentUser() user, @UploadedFile() file: any) {
    return this.onboardingService.updateOrganizerProfileImage(
      user.userId,
      file,
    );
  }
}
