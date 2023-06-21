import { Module } from '@nestjs/common';
import { ClientController } from './client.controller';
import { ClientService } from './client.services';
import { SbrcService } from '../services/sbrc/sbrc.service';
import { CredService } from 'src/services/cred/cred.service';
import { AadharService } from 'src/services/aadhar/aadhar.service';
import { UsersModule } from 'src/services/users/users.module';
@Module({
  imports: [UsersModule],
  controllers: [ClientController],
  providers: [ClientService, SbrcService, CredService, AadharService],
})
export class ClientModule {}
