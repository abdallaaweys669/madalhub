import { Body, Controller, Get, Post } from '@nestjs/common';
import { MemberService } from '../services/member.service';
import { CreateMemberDto } from '../dto/create-member.dto';
import { Param, ParseIntPipe, Patch, Delete } from '@nestjs/common';
import { UpdateMemberDto } from '../dto/update-member.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { UseGuards } from '@nestjs/common';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { ForbiddenException } from '@nestjs/common';

@Controller('member')
export class MemberController {
  constructor(private readonly memberService: MemberService) {}

  // member.controller.ts
  @UseGuards(JwtAuthGuard)
  @Get()
  findAll() {
    return this.memberService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.memberService.findOne(id);
  }

  @Post('register')
  register(@Body() dto: CreateMemberDto) {
    return this.memberService.register(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me')
  updateMe(@CurrentUser() user, @Body() dto: UpdateMemberDto) {
    return this.memberService.update(user.userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('me')
  remove(@CurrentUser() user) {
    return this.memberService.remove(user.userId);
  }
}
