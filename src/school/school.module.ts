import { Module } from '@nestjs/common';
import { SchoolController } from './school.controller';
import { SchoolService } from './school.services';
@Module({
  controllers: [SchoolController],
  providers: [SchoolService],
})
export class SchoolModule {}
