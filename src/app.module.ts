import { Module } from '@nestjs/common';
import { TestAPIModule } from './testapi/testapi.module';
import { SSOModule } from './sso/sso.module';
import { CredentialsModule } from './credentials/credentials.module';

@Module({
  imports: [TestAPIModule, SSOModule, CredentialsModule],
})
export class AppModule {}
