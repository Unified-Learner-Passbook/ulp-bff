import {
  Controller,
  Get,
  Post,
  Body,
  Headers,
  Param,
  Res,
} from '@nestjs/common';

//custom imports
import { Response } from 'express';
import { SSOService } from './sso.services';

@Controller('v1/sso')
export class SSOController {
  constructor(private readonly ssoService: SSOService) {}

  @Get('/student')
  getUser() {
    return `student api working`;
  }
  @Post('/student/register')
  async registerStudent(
    @Body('aadhaarid') aadhaarid: string,
    @Body('studentname') studentname: string,
    @Body('schoolname') schoolname: string,
    @Body('studentid') studentid: string,
    @Body('phoneno') phoneno: string,
  ) {
    return this.ssoService.registerStudent(
      aadhaarid,
      studentname,
      schoolname,
      studentid,
      phoneno,
    );
  }
  @Post('/student/login')
  async loginStudent(
    @Body('username') username: string,
    @Body('password') password: string,
  ) {
    return this.ssoService.loginStudent(username, password);
  }
  @Get('/student/getdid/:aadhaarid')
  async getDIDStudent(@Param('aadhaarid') aadhaarid: string) {
    return this.ssoService.getDIDStudent(aadhaarid);
  }
  @Get('/student/credentials')
  async credentialsStudent(@Headers('Authorization') auth: string) {
    const jwt = auth.replace('Bearer ', '');
    return this.ssoService.credentialsStudent(jwt);
  }
  @Post('/student/credentials/render')
  async renderCredentials(
    @Res() res: Response,
    @Headers('Authorization') auth: string,
    @Body('requestbody') requestbody: any,
  ) {
    const jwt = auth.replace('Bearer ', '');
    //return this.ssoService.renderCredentials(jwt, requestbody);
    return res
      .status(200)
      .contentType('application/pdf')
      .send(await this.ssoService.renderCredentials(jwt, requestbody));
  }
}
