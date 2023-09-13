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
} from '@nestjs/common';
import { CredentialsService } from './credentials.service';
import { Response } from 'express';

@Controller('v1/credentials')
export class CredentialsController {
  constructor(private readonly credentialsService: CredentialsService) {}

  @Get('/getSchema/:id')
  getSchema(@Param('id') id: string, @Res() response: Response) {
    return this.credentialsService.getSchema(id, response);
  }

  //get certificate id
  @Get('/get/:id')
  async getCredId(
    @Headers('Authorization') auth: string,
    @Param('id') id: string,
    @Res() response: Response,
  ) {
    const jwt = auth.replace('Bearer ', '');
    return this.credentialsService.getCredId(jwt, id, response);
  }

  //new credentials list schema id schema template
  //credentialsSearch
  @Post('/search/:type')
  async credentialsSearch(
    @Headers('Authorization') auth: string,
    @Param('type') type: string,
    @Body() requestbody: any,
    @Res() response: Response,
  ) {
    const jwt = auth.replace('Bearer ', '');
    return this.credentialsService.credentialsSearch(jwt, type, requestbody, response);
  }
  //credentialsSchema
  @Get('/schema/:id')
  async credentialsSchema(@Param('id') id: string, @Res() response: Response) {
    return this.credentialsService.credentialsSchema(id, response);
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
