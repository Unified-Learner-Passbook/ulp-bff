import { Module } from '@nestjs/common';
import { PortalController } from './portal.controller';
import { PortalService } from './portal.services';
import { KeycloakService } from '../services/keycloak/keycloak.service';
@Module({
  controllers: [PortalController],
  providers: [PortalService, KeycloakService],
})
export class PortalModule {}
