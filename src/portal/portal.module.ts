import { Module } from '@nestjs/common';
import { PortalController } from './portal.controller';
import { PortalService } from './portal.services';
import { KeycloakService } from '../services/keycloak/keycloak.service';
import { SbrcService } from '../services/sbrc/sbrc.service';
@Module({
  controllers: [PortalController],
  providers: [PortalService, KeycloakService,SbrcService],
})
export class PortalModule {}
