import {
  Body,
  Controller,
  Param,
  Post,
  Query,
  Res,
  Get,
  Headers,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { IssuerService } from './issuer.service';
import { Response } from 'express';
//import { UsersService } from 'src/services/users/users.service';

@Controller('v1')
export class IssuerController {
  constructor(
    private readonly issuerService: IssuerService,
  ) 
  {}

  //issuer
  //clienttoken
  @Post('/clienttoken')
  async getClientToken(
    @Body('password') password: string,
    @Res() response: Response,
  ) {
    return this.issuerService.getClientToken(password, response);
  }
  //getdid
  @Post('/getdid')
  async getDID(
    @Body('uniquetext') uniquetext: string,
    @Res() response: Response,
  ) {
    return this.issuerService.getDID(uniquetext, response);
  }
  //issuerregister
  @Post('/issuerregister')
  async getIssuerRegister(
    @Headers('Authorization') auth: string,
    @Body('name') name: string,
    @Body('did') did: string,
    @Body('username') username: string,
    @Body('password') password: string,
    @Res() response: Response,
  ) {
    const jwt = auth.replace('Bearer ', '');
    return this.issuerService.getIssuerRegister(
      jwt,
      name,
      did,
      username,
      password,
      response,
    );
  }
  //issuerdetail
  @Get('/issuerdetail')
  async getDetailIssuer(
    @Headers('Authorization') auth: string,
    @Res() response: Response,
  ) {
    const jwt = auth.replace('Bearer ', '');
    return this.issuerService.getDetailIssuer(jwt, response);
  }
  @Get('/issuerlist')
  async getListIssuer(@Res() response: Response) {
    return this.issuerService.getListIssuer(response);
  }

}
