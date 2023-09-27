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

  //digilocker
  //digilocker authorize
  @Get('/digilocker/authorize')
  async digilockerAuthorize(@Res() response: Response) {
    return this.ssoService.digilockerAuthorize(response);
  }
  //digilocker token
  @Post('/digilocker/token')
  async digilockerToken(
    @Res() response: Response,
    @Body('state') state: string,
    @Body('code_verifier') code_verifier: string,
    @Body('challenge') challenge: string,
    @Body('auth_code') auth_code: string,
  ) {
    return this.ssoService.digilockerToken(
      response,
      state,
      code_verifier,
      challenge,
      auth_code,
    );
  }
  //get digilocker userdata
  @Get('/digilocker/user')
  async digilockerUser(
    @Headers('Authorization') auth: string,
    @Res() response: Response,
  ) {
    const jwt = auth.replace('Bearer ', '');
    return this.ssoService.digilockerUser(jwt, response);
  }
  //get digilocker files
  @Get('/digilocker/files')
  async digilockerFiles(
    @Headers('Authorization') auth: string,
    @Res() response: Response,
  ) {
    const jwt = auth.replace('Bearer ', '');
    return this.ssoService.digilockerFiles(jwt, response);
  }
  //post digilocker files
  @Post('/digilocker/files/upload')
  async digilockerFilesUpload(
    @Headers('Authorization') auth: string,
    @Res() response: Response,
  ) {
    const jwt = auth.replace('Bearer ', '');
    return this.ssoService.digilockerFilesUpload(jwt, response);
  }
}
