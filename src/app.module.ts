import { Module } from '@nestjs/common';
import { SSOModule } from './sso/sso.module';
import { CredentialsModule } from './credentials/credentials.module';
import { AadhaarModule } from './aadhaar/aadhaar.module';

//call env variable
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot(),
    SSOModule,
    CredentialsModule,
    AadhaarModule,
  ],
})
export class AppModule {}
