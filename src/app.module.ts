import { Module } from '@nestjs/common';
import { TestAPIModule } from './testapi/testapi.module';
import { SSOModule } from './sso/sso.module';
import { CredentialsModule } from './credentials/credentials.module';

//call env variable
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TestAPIModule,
    SSOModule,
    CredentialsModule,
  ],
})
export class AppModule {}
