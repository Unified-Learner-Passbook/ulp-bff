import { Module } from '@nestjs/common';
import { AadharService } from 'src/services/aadhar/aadhar.service';
import { CredService } from 'src/services/cred/cred.service';
import { SbrcService } from 'src/services/sbrc/sbrc.service';
import { SSOController } from './sso.controller';
import { SSOService } from './sso.services';
@Module({
  controllers: [SSOController],
  providers: [SSOService, AadharService, CredService, SbrcService],
})
export class SSOModule {}
