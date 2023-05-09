import { Module } from '@nestjs/common';
import { SchoolController } from './school.controller';
import { SchoolService } from './school.services';
import { AadharService } from '../services/aadhar/aadhar.service';
import { UdiseService } from 'src/services/udise/udise.service';
@Module({
  controllers: [SchoolController],
  providers: [SchoolService, AadharService, UdiseService],
})
export class SchoolModule {}
