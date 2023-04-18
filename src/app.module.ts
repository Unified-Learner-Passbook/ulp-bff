import { Module } from '@nestjs/common';
import { SSOModule } from './sso/sso.module';
import { CredentialsModule } from './credentials/credentials.module';
import { AadhaarModule } from './aadhaar/aadhaar.module';
import { SchoolModule } from './school/school.module';
import { ClientModule } from './client/client.module';
import { PortalModule } from './portal/portal.module';

//call env variable
import { ConfigModule } from '@nestjs/config';
import { CredService } from './services/cred/cred.service';
import { SbrcService } from './services/sbrc/sbrc.service';
import { HttpModule, HttpModuleOptions } from '@nestjs/axios';
import { getEnvPath } from './utils/helper/helper';

const envFilePath: string = getEnvPath(`${__dirname}/utils/envs`);
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
    //AadhaarModule,
    SchoolModule,
    ClientModule,
    PortalModule,
  ],
  providers: [CredService, SbrcService],
})
export class AppModule {}
