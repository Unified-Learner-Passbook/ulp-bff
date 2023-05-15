import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { CredService } from 'src/services/cred/cred.service';
import { SbrcService } from 'src/services/sbrc/sbrc.service';
import { TelemetryService } from 'src/services/telemetry/telemetry.service';
import { CredentialsController } from './credentials.controller';
import { CredentialsService } from './credentials.service';
import { KeycloakService } from 'src/services/keycloak/keycloak.service';

@Module({
  controllers: [CredentialsController],
  providers: [
    CredentialsService,
    CredService,
    SbrcService,
    TelemetryService,
    KeycloakService,
  ],
})
export class CredentialsModule {}
