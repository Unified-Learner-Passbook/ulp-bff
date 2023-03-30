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
}
