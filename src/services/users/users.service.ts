import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Assesment } from './entity/assesment.entity';
import { Benefit } from './entity/benefit.entity';
import { Enrollment } from './entity/enrollment.entity';

@Injectable()
export class UsersService {

    constructor(
        @InjectRepository(Enrollment) private readonly enrollmentRepository: Repository<Enrollment>,
        @InjectRepository(Assesment) private readonly assesmentRepository: Repository<Assesment>,
        @InjectRepository(Benefit) private readonly benefitRepository: Repository<Benefit>
    ) { }

    findAllEnrollment(): Promise<Enrollment[]> {
        return this.enrollmentRepository.find()
    }

    findAllAssesment(): Promise<Assesment[]> {
        return this.assesmentRepository.find()
    }

    findAllBenefit(): Promise<Benefit[]> {
        return this.benefitRepository.find()
    }
    
}
