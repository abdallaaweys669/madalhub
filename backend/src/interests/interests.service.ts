import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Interest } from 'src/database/entities/interest.entity';
import { Repository } from 'typeorm';

@Injectable()
export class InterestsService {
  constructor(
    @InjectRepository(Interest)
    private interestRepo: Repository<Interest>,
  ) {}

  async getAll() {
    const interests = await this.interestRepo.find({
      select: ['id', 'name'],
    });

    return { interests };
  }
}
