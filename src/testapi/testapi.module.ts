import { Module } from '@nestjs/common';
import { TestAPIController } from './testapi.controller';
import { TestAPIService } from './testapi.services';

@Module({
  controllers: [TestAPIController],
  providers: [TestAPIService],
})
export class TestAPIModule {}
