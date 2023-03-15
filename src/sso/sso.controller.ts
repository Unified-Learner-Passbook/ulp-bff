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
import { UserDto } from './dto/user-dto';

@Controller('v1/sso')
export class SSOController {
  constructor(private readonly ssoService: SSOService) {}

  @Get('/student')
  getUser(@Res() response: Response) {
    const result = { success: true, message: 'Student API Working 16 March' };
    response.status(200).send(result);
  }
  @Post('/student/register')
  async registerStudent(@Body() user: UserDto, @Res() response: Response) {
    return this.ssoService.registerStudent(user, response);
  }
  @Post('/student/login')
  async loginStudent(
    @Body('username') username: string,
    @Body('password') password: string,
    @Res() response: Response,
  ) {
    return this.ssoService.loginStudent(username, password, response);
  }
  @Get('/student/getdid/:studentid')
  async getDIDStudent(
    @Param('studentid') studentid: string,
    @Res() response: Response,
  ) {
    return this.ssoService.getDIDStudent(studentid, response);
  }
  @Get('/student/credentials')
  async credentialsStudent(
    @Headers('Authorization') auth: string,
    @Res() response: Response,
  ) {
    const jwt = auth.replace('Bearer ', '');
    return this.ssoService.credentialsStudent(jwt, response);
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
    @Res() response: Response,
  ) {
    const jwt = auth.replace('Bearer ', '');
    return this.ssoService.renderCredentialsHTML(jwt, requestbody, response);
  }
  @Get('/student/credentials/rendertemplate/:id')
  async renderTemplate(@Param('id') id: string, @Res() response: Response) {
    return this.ssoService.renderTemplate(id, response);
  }
  @Get('/student/credentials/rendertemplateschema/:id')
  async renderTemplateSchema(
    @Param('id') id: string,
    @Res() response: Response,
  ) {
    return this.ssoService.renderTemplateSchema(id, response);
  }
  //digilocker authorize
  @Get('/digilocker/authorize')
  async digilockerAuthorize(@Res() response: Response) {
    return this.ssoService.digilockerAuthorize(response);
  }
  //digilocker token
  @Post('/digilocker/token')
  async digilockerToken(
    @Res() response: Response,
    @Body('auth_code') auth_code: string,
  ) {
    return this.ssoService.digilockerToken(response, auth_code);
  }
}
