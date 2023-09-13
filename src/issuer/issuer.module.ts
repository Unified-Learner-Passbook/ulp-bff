import { Module } from '@nestjs/common';
import { IssuerService } from './issuer.service';
import { IssuerController } from './issuer.controller';
import { CredService } from 'src/services/cred/cred.service';
import { SbrcService } from 'src/services/sbrc/sbrc.service';
import { TelemetryService } from 'src/services/telemetry/telemetry.service';
import { AadharService } from 'src/services/aadhar/aadhar.service';
import { KeycloakService } from 'src/services/keycloak/keycloak.service';

@Module({
  controllers: [IssuerController],
  providers: [
    IssuerService,
    CredService,
    SbrcService,
    TelemetryService,
    AadharService,
    KeycloakService,
  ],
})
export class IssuerModule {}
