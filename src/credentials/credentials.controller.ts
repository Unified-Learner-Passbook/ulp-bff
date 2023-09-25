import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Res,
  Headers,
  StreamableFile,
  Delete,
} from '@nestjs/common';
import { CredentialsService } from './credentials.service';
import { Response } from 'express';

@Controller('v1/credentials')
export class CredentialsController {
  constructor(private readonly credentialsService: CredentialsService) {}

  //new credentials list schema id schema template
  //reissue credentials
  @Post('/reissue/:id')
  async credentialsReissue(
    @Headers('Authorization') auth: string,
    @Param('id') credId: string,
    @Body("credentialSubject") credentialSubject: any,
    @Res() response: Response,
  ) {
    const jwt = auth.replace('Bearer ', '');
    return this.credentialsService.credentialsReissue(jwt, credId,credentialSubject, response);
  }
  //revoke credentials
  @Delete('/revoke/:id')
  async credentialsRevoke(
    @Headers('Authorization') auth: string,
    @Param('id') credId: string,
    @Res() response: Response,
  ) {
    const jwt = auth.replace('Bearer ', '');
    return this.credentialsService.credentialsRevoke(jwt, credId, response);
  }
  //credentialsSearch
  @Post('/search')
  async credentialsSearch(
    @Headers('Authorization') auth: string,
    @Body() requestbody: any,
    @Res() response: Response,
  ) {
    const jwt = auth.replace('Bearer ', '');
    return this.credentialsService.credentialsSearch(jwt, requestbody, response);
  }
  //getCredentials
  @Get('/json/:id')
  async getCredentials(@Param('id') id: string, @Res() response: Response) {
    return this.credentialsService.getCredentials(id, response);
  }
  @Get('/rendertemplateschema/:id')
  async renderTemplateSchema(
    @Param('id') id: string,
    @Res() response: Response,
  ) {
    return this.credentialsService.renderTemplateSchema(id, response);
  }
  //credentialsSchemaJSON
  @Get('/schema/json/:id')
  async credentialsSchemaJSON(
    @Param('id') id: string,
    @Res() response: Response,
  ) {
    return this.credentialsService.credentialsSchemaJSON(id, response);
  }
  @Post('/render')
  async renderCredentials(
    @Headers('Authorization') auth: string,
    @Body() requestbody: any,
    @Res({ passthrough: true }) response,
  ): Promise<string | StreamableFile> {
    const jwt = auth.replace('Bearer ', '');
    response.header('Content-Type', 'application/pdf');

    return this.credentialsService.renderCredentials(jwt, requestbody);
  }
  @Post('/renderhtml')
  async renderCredentialsHTML(
    @Headers('Authorization') auth: string,
    @Body() requestbody: any,
    @Res() response: Response,
  ) {
    const jwt = auth.replace('Bearer ', '');
    return this.credentialsService.renderCredentialsHTML(jwt, requestbody, response);
  }
  //credentialsVerify
  @Get('/verify/:id')
  async credentialsVerify(@Param('id') id: string, @Res() response: Response) {
    return this.credentialsService.credentialsVerify(id, response);
  }
}
