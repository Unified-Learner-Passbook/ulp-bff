import { Module } from '@nestjs/common';
import { SSOController } from './sso.controller';
import { SSOService } from './sso.services';
@Module({
  controllers: [SSOController],
  providers: [SSOService],
})
export class SSOModule {}
