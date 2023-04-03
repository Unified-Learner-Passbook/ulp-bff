import { Module } from '@nestjs/common';
import { SSOModule } from './sso/sso.module';
import { CredentialsModule } from './credentials/credentials.module';
import { AadhaarModule } from './aadhaar/aadhaar.module';
import { SchoolModule } from './school/school.module';
import { PublicSchoolModule } from './publicschool/publicschool.module';

//call env variable
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot(),
    SSOModule,
    CredentialsModule,
    AadhaarModule,
    SchoolModule,
    PublicSchoolModule,
  ],
})
export class AppModule {}
