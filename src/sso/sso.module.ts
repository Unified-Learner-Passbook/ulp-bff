import { Module } from '@nestjs/common';
import { AadharService } from 'src/services/aadhar/aadhar.service';
import { SSOController } from './sso.controller';
import { SSOService } from './sso.services';
@Module({
  controllers: [SSOController],
  providers: [SSOService, AadharService],
})
export class SSOModule {}
