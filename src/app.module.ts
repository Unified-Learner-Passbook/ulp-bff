import { Module } from '@nestjs/common';
import { TestAPIModule } from './testapi/testapi.module';
import { SSOModule } from './sso/sso.module';

@Module({
  imports: [TestAPIModule, SSOModule],
})
export class AppModule {}
