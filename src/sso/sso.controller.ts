import {
  Controller,
  Get,
  Post,
  Body,
  Headers,
  Param,
  Res,
  StreamableFile,
} from '@nestjs/common';

//custom imports
import axios from 'axios';
import { Response } from 'express';
import { SSOService } from './sso.services';

@Controller('v1/sso')
export class SSOController {
  constructor(private readonly ssoService: SSOService) {}

  @Get('/student')
  getUser() {
    return `student api working 9 march docker updated new 2`;
  }
  @Post('/student/register')
  async registerStudent(
    @Body('aadhaarid') aadhaarid: string,
    @Body('studentname') studentname: string,
    @Body('schoolname') schoolname: string,
    @Body('schoolid') schoolid: string,
    @Body('studentid') studentid: string,
    @Body('phoneno') phoneno: string,
  ) {
    return this.ssoService.registerStudent(
      aadhaarid,
      studentname,
      schoolname,
      schoolid,
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
  @Get('/student/getdid/:studentid')
  async getDIDStudent(@Param('studentid') studentid: string) {
    return this.ssoService.getDIDStudent(studentid);
  }
  @Get('/student/credentials')
  async credentialsStudent(@Headers('Authorization') auth: string) {
    const jwt = auth.replace('Bearer ', '');
    return this.ssoService.credentialsStudent(jwt);
  }
  @Post('/student/credentials/render')
  async renderCredentials(
    @Headers('Authorization') auth: string,
    @Body() requestbody: any,
    @Res({ passthrough: true }) response,
  ): Promise<string | StreamableFile> {
    const jwt = auth.replace('Bearer ', '');
    response.header('Content-Type', 'application/pdf');
    return this.ssoService.renderCredentials(jwt, requestbody);
  }
  @Post('/student/credentials/renderhtml')
  async renderCredentialsHTML(
    @Headers('Authorization') auth: string,
    @Body() requestbody: any,
  ) {
    const jwt = auth.replace('Bearer ', '');
    return this.ssoService.renderCredentialsHTML(jwt, requestbody);
  }
  @Get('/student/credentials/rendertemplate/:id')
  async renderTemplate(@Param('id') id: string) {
    return this.ssoService.renderTemplate(id);
  }
}
