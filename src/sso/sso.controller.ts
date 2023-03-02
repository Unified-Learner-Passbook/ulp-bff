import { Controller, Get, Param, Post, Body } from '@nestjs/common';
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
}
