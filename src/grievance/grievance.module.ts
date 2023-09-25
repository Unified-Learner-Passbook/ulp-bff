import { Module } from '@nestjs/common';
import { GrievanceController } from './grievance.controller';
import {GrievanceService} from './grievance.service';
import { SbrcService } from 'src/services/sbrc/sbrc.service';
import { KeycloakService } from 'src/services/keycloak/keycloak.service';
import { CredService } from 'src/services/cred/cred.service';
@Module({
    controllers: [GrievanceController],
    providers: [GrievanceService,SbrcService,KeycloakService,CredService],
})
export class GrievanceModule {}