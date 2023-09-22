import { Module } from '@nestjs/common';
import { ClaimAttestController } from './claimAttest.controller';
import {ClaimAttestService} from './claimAttest.service';
import { SbrcService } from 'src/services/sbrc/sbrc.service';
import { KeycloakService } from 'src/services/keycloak/keycloak.service';
import { CredService } from 'src/services/cred/cred.service';
@Module({
    controllers: [ClaimAttestController],
    providers: [ClaimAttestService,SbrcService,KeycloakService,CredService],
})
export class ClaimAttestModule {}