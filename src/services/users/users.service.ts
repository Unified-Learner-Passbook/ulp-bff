import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Assesment } from './entity/assesment.entity';
import { Benefit } from './entity/benefit.entity';
import { Enrollment } from './entity/enrollment.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(Enrollment)
    private readonly enrollmentRepository: Repository<Enrollment>,
    @InjectRepository(Assesment)
    private readonly assesmentRepository: Repository<Assesment>,
    @InjectRepository(Benefit)
    private readonly benefitRepository: Repository<Benefit>,
  ) {}

  findAllEnrollment(): Promise<Enrollment[]> {
    return this.enrollmentRepository.query(
      `SELECT * FROM public.enrollmentv2 ORDER BY "Id" ASC `,
    );
  }

  findAllAssesment(): Promise<Assesment[]> {
    return this.assesmentRepository.query(
      `SELECT * FROM public.assesment ORDER BY "Id" ASC`,
    );
  }

  findAllBenefit(): Promise<Benefit[]> {
    return this.benefitRepository.query(
      `SELECT * FROM public.benefit ORDER BY "Id" ASC`,
    );
  }
}
