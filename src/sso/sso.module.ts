import { Module } from '@nestjs/common';
import { AadharService } from 'src/services/aadhar/aadhar.service';
import { SSOController } from './sso.controller';
import { SSOService } from './sso.services';

import { SbrcService } from 'src/services/sbrc/sbrc.service';
import { CredService } from 'src/services/cred/cred.service';
import { KeycloakService } from 'src/services/keycloak/keycloak.service';
@Module({
  controllers: [SSOController],
  providers: [
    SSOService,
    AadharService,
    SbrcService,
    CredService,
    KeycloakService,
  ],
})
export class SSOModule {}
