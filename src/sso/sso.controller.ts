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
      message: 'Student API Working 25 April Dev Server',
    };
    response.status(200).send(result);
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

  //digilocker aadhaar
  @Post('/digilocker/aadhaar')
  async digilockerAadhaar(
    @Res() response: Response,
    @Body('digiacc') digiacc: string,
    @Body('aadhaar_id') aadhaar_id: string,
    @Body('aadhaar_name') aadhaar_name: string,
    @Body('aadhaar_dob') aadhaar_dob: string,
    @Body('aadhaar_gender') aadhaar_gender: string,
    @Body('digilocker_id') digilocker_id: string,
  ) {
    return this.ssoService.digilockerAadhaar(
      response,
      digiacc,
      aadhaar_id,
      aadhaar_name,
      aadhaar_dob,
      aadhaar_gender,
      digilocker_id,
    );
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
  //new credentials list schema id schema template
  //credentialsSearch
  @Post('/student/credentials/search/:type')
  async credentialsSearch(
    @Headers('Authorization') auth: string,
    @Param('type') type: string,
    @Body() requestbody: any,
    @Res() response: Response,
  ) {
    const jwt = auth.replace('Bearer ', '');
    return this.ssoService.credentialsSearch(jwt, type, requestbody, response);
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
  //studentAadhaarVerify
  @Post('/student/aadhaar/verify')
  async studentAadhaarVerify(
    @Headers('Authorization') auth: string,
    @Body('studentData') studentData: any,
    @Res() response: Response,
  ) {
    const jwt = auth.replace('Bearer ', '');
    return this.ssoService.studentAadhaarVerify(jwt, studentData, response);
  }
  //upload student bulk register
  @Post('/student/bulk/credentials')
  async studentBulkCredentials(
    @Headers('Authorization') auth: string,
    @Body() requestbody: any,
    @Res() response: Response,
  ) {
    const jwt = auth.replace('Bearer ', '');
    return this.ssoService.studentBulkCredentials(jwt, requestbody, response);
  }
}
