import { Module } from '@nestjs/common';
import { PublicSchoolController } from './publicschool.controller';
import { PublicSchoolService } from './publicschool.services';
@Module({
  controllers: [PublicSchoolController],
  providers: [PublicSchoolService],
})
export class PublicSchoolModule {}
