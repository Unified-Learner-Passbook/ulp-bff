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
    //console.log('hi');
    const result = {
      success: true,
      message: 'Student API Working 20 March',
    };
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

  @Post('/studentDetail')
  async getStudentDetail(@Body() requestbody: any, @Res() response: Response) {
    return this.ssoService.getStudentDetail(requestbody, response);
  }
  
  @Post('/studentDetailV2')
  async getStudentDetailV2(@Body() requestbody: any, @Res() response: Response) {
    return this.ssoService.getStudentDetailV2(requestbody, response);
  }

  //digilocker authorize
  @Get('/digilocker/authorize/:digiacc')
  async digilockerAuthorize(
    @Param('digiacc') digiacc: string,
    @Res() response: Response,
  ) {
    return this.ssoService.digilockerAuthorize(digiacc, response);
  }
  //digilocker token
  @Post('/digilocker/token')
  async digilockerToken(
    @Res() response: Response,
    @Body('digiacc') digiacc: string,
    @Body('auth_code') auth_code: string,
  ) {
    return this.ssoService.digilockerToken(response, digiacc, auth_code);
  }
  //digilocker keycloak sunbird rc register and get token
  @Post('/digilocker/register')
  async digilockerRegister(
    @Res() response: Response,
    @Body('digiacc') digiacc: string,
    @Body('userdata') userdata: any,
    @Body('digimpid') digimpid: string,
  ) {
    return this.ssoService.digilockerRegister(
      response,
      digiacc,
      userdata,
      digimpid,
    );
  }
  //token data response
  @Get('/user/:digiacc')
  async userData(
    @Headers('Authorization') auth: string,
    @Param('digiacc') digiacc: string,
    @Res() response: Response,
  ) {
    const jwt = auth.replace('Bearer ', '');
    return this.ssoService.userData(jwt, digiacc, response);
  }
  //token school data response
  @Get('/school/:udise')
  async schoolData(
    @Headers('Authorization') auth: string,
    @Param('udise') udise: string,
    @Res() response: Response,
  ) {
    const jwt = auth.replace('Bearer ', '');
    return this.ssoService.schoolData(jwt, udise, response);
  }
  //udise verify
  @Get('/udise/verify/:udiseid')
  async udiseVerify(
    @Param('udiseid') udiseid: string,
    @Res() response: Response,
  ) {
    return this.ssoService.udiseVerify(udiseid, response);
  }
  //get school list
  @Get('/udise/school/list')
  async getSchoolList(@Res() response: Response) {
    return this.ssoService.getSchoolList(response);
  }
  //get school list id
  @Get('/udise/school/list/:udise')
  async getSchoolListUdise(
    @Param('udise') udise: string,
    @Res() response: Response,
  ) {
    return this.ssoService.getSchoolListUdise(udise, response);
  }
  //new credentials list schema id schema template
  //credentialsSearch
  @Post('/student/credentials/search')
  async credentialsSearch(
    @Headers('Authorization') auth: string,
    @Body() requestbody: any,
    @Res() response: Response,
  ) {
    const jwt = auth.replace('Bearer ', '');
    return this.ssoService.credentialsSearch(jwt, requestbody, response);
  }
  //credentialsIssue
  @Post('/student/credentials/issue')
  async credentialsIssue(
    @Headers('Authorization') auth: string,
    @Body() requestbody: any,
    @Res() response: Response,
  ) {
    const jwt = auth.replace('Bearer ', '');
    return this.ssoService.credentialsIssue(jwt, requestbody, response);
  }
  //credentialsSchema
  @Get('/student/credentials/schema/:id')
  async credentialsSchema(@Param('id') id: string, @Res() response: Response) {
    return this.ssoService.credentialsSchema(id, response);
  }
  //credentialsSchemaJSON
  @Get('/student/credentials/schema/json/:id')
  async credentialsSchemaJSON(
    @Param('id') id: string,
    @Res() response: Response,
  ) {
    return this.ssoService.credentialsSchemaJSON(id, response);
  }
  //upload student bulk register
  @Post('/student/bulk/register')
  async studentBulkRegister(
    @Headers('Authorization') auth: string,
    @Body() requestbody: any,
    @Res() response: Response,
  ) {
    const jwt = auth.replace('Bearer ', '');
    return this.ssoService.studentBulkRegister(jwt, requestbody, response);
  }
  //upload student bulk register
  /*@Get('/student/list')
  async studentList(
    @Headers('Authorization') auth: string,
    @Res() response: Response,
  ) {
    const jwt = auth.replace('Bearer ', '');
    return this.ssoService.studentList(jwt, response);
  }*/
}
