import { Module } from '@nestjs/common';
import { ClientController } from './client.controller';
import { ClientService } from './client.services';
import { SbrcService } from '../services/sbrc/sbrc.service';
import { CredService } from 'src/services/cred/cred.service';
@Module({
  controllers: [ClientController],
  providers: [ClientService,SbrcService,CredService],
})
export class ClientModule {}
