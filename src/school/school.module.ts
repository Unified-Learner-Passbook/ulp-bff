import { Module } from '@nestjs/common';
import { SchoolController } from './school.controller';
import { SchoolService } from './school.services';
import { AadharService } from '../services/aadhar/aadhar.service';
@Module({
  controllers: [SchoolController],
  providers: [SchoolService, AadharService],
})
export class SchoolModule {}
