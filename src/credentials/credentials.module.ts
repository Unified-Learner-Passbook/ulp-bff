import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { CredService } from 'src/services/cred/cred.service';
import { SbrcService } from 'src/services/sbrc/sbrc.service';
import { CredentialsController } from './credentials.controller';
import { CredentialsService } from './credentials.service';

@Module({
  controllers: [CredentialsController],
  providers: [CredentialsService, CredService, SbrcService]
})
export class CredentialsModule {}
