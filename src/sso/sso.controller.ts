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
import { SSOService } from './sso.services';

@Controller('v1/sso')
export class SSOController {
  constructor(private readonly ssoService: SSOService) {}

  //aadhaar ekyc
  @Post('/aadhaar/ekyc')
  async getAadhaarEkyc(
    @Res() response: Response,
    @Body('aadhaar_id') aadhaar_id: string,
  ) {
    return this.ssoService.getAadhaarEkyc(response, aadhaar_id);
  }
}
