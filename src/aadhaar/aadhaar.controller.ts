import {
  Controller,
  Get,
  Post,
  Body,
  Headers,
  Param,
  Res,
  StreamableFile,
  Req,
} from '@nestjs/common';

//custom imports
import axios from 'axios';
import { Response, Request } from 'express';
import { AadhaarService } from './aadhaar.services';

@Controller('v1/aadhaar')
export class AadhaarController {
  constructor(private readonly aadhaarService: AadhaarService) {}

  @Get('/test')
  getUser(@Res() response: Response) {
    const result = {
      success: true,
      message: 'Aadhaar API Working 29 March',
    };
    response.status(200).send(result);
  }
  @Post('/verify')
  async aadhaarVerify(
    @Body('aadhaar_id') aadhaar_id: string,
    @Res() response: Response,
  ) {
    return this.aadhaarService.aadhaarVerify(aadhaar_id, response);
  }
  @Post('/demographic')
  async aadhaarDemographic(
    @Body('aadhaar_id') aadhaar_id: string,
    @Body('aadhaar_name') aadhaar_name: string,
    @Res() response: Response,
  ) {
    return this.aadhaarService.aadhaarDemographic(
      aadhaar_id,
      aadhaar_name,
      response,
    );
  }
  @Post('/auth/sentotp')
  async aadhaarAuthSentOTP(
    @Body('aadhaar_id') aadhaar_id: string,
    @Res() response: Response,
  ) {
    return this.aadhaarService.aadhaarAuthSentOTP(
      aadhaar_id,
      response,
    );
  }
  @Post('/auth/verifyotp')
  async aadhaarAuthVerifyOTP(
    @Body('aadhaar_id') aadhaar_id: string,
    @Body('aadhaar_otp') aadhaar_otp: string,
    @Body('aadhaar_txn') aadhaar_txn: string,
    @Res() response: Response,
  ) {
    return this.aadhaarService.aadhaarAuthVerifyOTP(
      aadhaar_id,
      aadhaar_otp,
      aadhaar_txn,
      response,
    );
  }
}
