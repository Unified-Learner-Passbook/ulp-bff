import { Module } from '@nestjs/common';
import { SbrcController } from './sbrcapi.controller';
import { SbrcapiService } from './sbrcapi.services';
import { KeycloakService } from 'src/services/keycloak/keycloak.service';
import { SbrcService } from 'src/services/sbrc/sbrc.service';

@Module({
  controllers: [SbrcController],
  providers: [SbrcapiService, KeycloakService, SbrcService],
})
export class SbrcapiModule {}
