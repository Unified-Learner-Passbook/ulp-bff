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
  Put,
  Delete,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { SchemaService } from './schema.service';
import { Response } from 'express';
//import { UsersService } from 'src/services/users/users.service';

@Controller('v1/credential')
export class SchemaController {
  constructor(private readonly issuerService: SchemaService) {}

  //schema
  //get credentials/schema/required
  @Post('/schema/create')
  async getCredentialSchemaCreate(
    @Body() postrequest: any,
    @Res() response: Response,
  ) {
    return this.issuerService.getCredentialSchemaCreate(postrequest, response);
  }
  //put credentials/schema/update
  @Put('/schema/update/:id/:version')
  async getCredentialSchemaUpdate(
    @Body() postrequest: any,
    @Param('id') id: string,
    @Param('version') version: string,
    @Res() response: Response,
  ) {
    return this.issuerService.getCredentialSchemaUpdate(
      postrequest,
      id,
      version,
      response,
    );
  }
  //put credentials/schema/revoke
  @Put('/schema/revoke/:id/:version')
  async getCredentialSchemaRevoke(
    @Param('id') id: string,
    @Param('version') version: string,
    @Res() response: Response,
  ) {
    return this.issuerService.getCredentialSchemaRevoke(id,version, response);
  }
  //get schema list
  @Post('/schema/list')
  async getCredentialSchemaList(
    @Body() postrequest: any,
    @Res() response: Response,
  ) {
    return this.issuerService.getCredentialSchemaList(postrequest, response);
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
  //schema template update
  @Put('/schema/template/update/:id')
  async getCredentialSchemaTemplateUpdate(
    @Body() postrequest: any,
    @Param('id') id: string,
    @Res() response: Response,
  ) {
    return this.issuerService.getCredentialSchemaTemplateUpdate(
      postrequest,
      id,
      response,
    );
  }
  //schema template delete
  @Delete('/schema/template/delete/:id')
  async getCredentialSchemaTemplateDelete(
    @Param('id') id: string,
    @Res() response: Response,
  ) {
    return this.issuerService.getCredentialSchemaTemplateDelete(id, response);
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
