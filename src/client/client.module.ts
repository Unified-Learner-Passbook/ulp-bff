import { Module } from '@nestjs/common';
import { ClientController } from './client.controller';
import { ClientService } from './client.services';
@Module({
  controllers: [ClientController],
  providers: [ClientService],
})
export class ClientModule {}
