import { Module } from '@nestjs/common';
import { AadhaarController } from './aadhaar.controller';
import { AadhaarService } from './aadhaar.services';
@Module({
  controllers: [AadhaarController],
  providers: [AadhaarService],
})
export class AadhaarModule {}
 