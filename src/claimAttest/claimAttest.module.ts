import { Module } from '@nestjs/common';
import { ClaimAttestController } from './claimAttest.controller';
import {ClaimAttestService} from './claimAttest.service';
import { SbrcService } from 'src/services/sbrc/sbrc.service';
import { KeycloakService } from 'src/services/keycloak/keycloak.service';
@Module({
    controllers: [ClaimAttestController],
    providers: [ClaimAttestService,SbrcService,KeycloakService],
})
export class ClaimAttestModule {}