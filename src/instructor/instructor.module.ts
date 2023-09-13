import { Module } from '@nestjs/common';
import { InstructorService } from './instructor.service';
import { InstructorController } from './instructor.controller';
import { CredService } from 'src/services/cred/cred.service';
import { SbrcService } from 'src/services/sbrc/sbrc.service';
import { TelemetryService } from 'src/services/telemetry/telemetry.service';
import { AadharService } from 'src/services/aadhar/aadhar.service';
import { KeycloakService } from 'src/services/keycloak/keycloak.service';

@Module({
  controllers: [InstructorController],
  providers: [
    InstructorService,
    CredService,
    SbrcService,
    TelemetryService,
    AadharService,
    KeycloakService,
  ],
})
export class InstructorModule {}
