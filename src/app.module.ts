import { Module } from '@nestjs/common';
import { SSOModule } from './sso/sso.module';
import { CredentialsModule } from './credentials/credentials.module';
import { SchoolModule } from './school/school.module';
import { ClientModule } from './client/client.module';
import { PortalModule } from './portal/portal.module';

//call env variable
import { ConfigModule } from '@nestjs/config';
import { CredService } from './services/cred/cred.service';
import { SbrcService } from './services/sbrc/sbrc.service';
import { HttpModule, HttpModuleOptions } from '@nestjs/axios';
import { getEnvPath } from './services/helper/helper';
import { AadharService } from './services/aadhar/aadhar.service';
import { KeycloakService } from './services/keycloak/keycloak.service';
import { UdiseService } from 'src/services/udise/udise.service';
import { TelemetryService } from './services/telemetry/telemetry.service';

const envFilePath: string = getEnvPath(`${__dirname}/envs`);
//console.log('envFilePath', envFilePath);
@Module({
  imports: [
    ConfigModule.forRoot({ envFilePath, isGlobal: true }),
    //HttpModule,
    {
      ...HttpModule.register({}),
      global: true,
    },
    SSOModule,
    CredentialsModule,
    SchoolModule,
    ClientModule,
    PortalModule,
  ],
  providers: [
    CredService,
    SbrcService,
    AadharService,
    KeycloakService,
    UdiseService,
    TelemetryService,
  ],
})
export class AppModule {}
