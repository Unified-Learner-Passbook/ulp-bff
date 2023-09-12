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
import { SchemaService } from './schema.service';
import { Response } from 'express';
//import { UsersService } from 'src/services/users/users.service';

@Controller('v1/credential')
export class SchemaController {
  constructor(
    private readonly issuerService: SchemaService,
  ) 
  {}

  //schema
  //get credentials/schema/required
  @Post('/schema/create')
  async getCredentialSchemaCreate(
    @Body() postrequest: any,
    @Res() response: Response,
  ) {
    return this.issuerService.getCredentialSchemaCreate(
      postrequest,
      response,
    );
  }
  //get schema list
  @Post('/schema/list')
  async getCredentialSchemaList(
    @Body() postrequest: any,
    @Res() response: Response,
  ) {
    return this.issuerService.getCredentialSchemaList(
      postrequest,
      response,
    );
  }
  //schema template create
  @Post('/schema/template/create')
  async getCredentialSchemaTemplateCreate(
    @Body() postrequest: any,
    @Res() response: Response,
  ) {
    return this.issuerService.getCredentialSchemaTemplateCreate(
      postrequest,
      response,
    );
  }
  //schema template list
  @Post('/schema/template/list')
  async getCredentialSchemaTemplateList(
    @Body() postrequest: any,
    @Res() response: Response,
  ) {
    return this.issuerService.getCredentialSchemaTemplateList(
      postrequest,
      response,
    );
  }
  //get scheama field
  @Post('/schema/fields')
  async getSchemaFields(
    @Body('schema_id') schema_id: string,
    @Res() response: Response,
  ) {
    return this.issuerService.getSchemaFields(schema_id, response);
  }

}
