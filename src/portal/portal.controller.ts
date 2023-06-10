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
import { Response, Request } from 'express';
import { PortalService } from './portal.services';

@Controller('v1/portal')
export class PortalController {
  constructor(private readonly portalService: PortalService) {}

  @Get('/test')
  getUser(@Res() response: Response) {
    const result = {
      success: true,
      message: 'Portal API Working 7 June 23',
    };
    response.status(200).send(result);
  }
  @Post('/count')
  async searchCount(
    @Headers('Authorization') auth: string,
    @Body('countFields') countFields: any,
    @Res() response: Response,
  ) {
    const jwt = auth.replace('Bearer ', '');
    return this.portalService.searchCount(jwt, countFields, response);
  }
  @Post('/getdid')
  async getDID(
    @Body('uniquetext') uniquetext: string,
    @Res() response: Response,
  ) {
    return this.portalService.getDID(uniquetext, response);
  }
  @Post('/aadhaar')
  async getAadhaar(
    @Body('aadhaar_id') aadhaar_id: string,
    @Body('aadhaar_name') aadhaar_name: string,
    @Body('aadhaar_dob') aadhaar_dob: string,
    @Body('aadhaar_gender') aadhaar_gender: string,
    @Res() response: Response,
  ) {
    return this.portalService.getAadhaar(
      aadhaar_id,
      aadhaar_name,
      aadhaar_dob,
      aadhaar_gender,
      response,
    );
  }
  @Post('/credentials')
  async credentials(
    @Headers('Authorization') auth: string,
    @Body('did') did: string,
    @Res() response: Response,
  ) {
    const jwt = auth.replace('Bearer ', '');
    return this.portalService.credentials(jwt, did, response);
  }
  @Post('/credentials/render')
  async renderCredentials(
    @Headers('Authorization') auth: string,
    @Body() requestbody: any,
    @Res({ passthrough: true }) response,
  ): Promise<string | StreamableFile> {
    const jwt = auth.replace('Bearer ', '');
    response.header('Content-Type', 'application/pdf');
    return this.portalService.renderCredentials(jwt, requestbody);
  }
  @Post('/credentials/renderhtml')
  async renderCredentialsHTML(
    @Headers('Authorization') auth: string,
    @Body() requestbody: any,
    @Res() response: Response,
  ) {
    const jwt = auth.replace('Bearer ', '');
    return this.portalService.renderCredentialsHTML(jwt, requestbody, response);
  }
  @Get('/credentials/rendertemplate/:id')
  async renderTemplate(@Param('id') id: string, @Res() response: Response) {
    return this.portalService.renderTemplate(id, response);
  }
  @Get('/credentials/rendertemplateschema/:id')
  async renderTemplateSchema(
    @Param('id') id: string,
    @Res() response: Response,
  ) {
    return this.portalService.renderTemplateSchema(id, response);
  }
  //new credentials list schema id schema template
  //credentialsSearch
  @Post('/credentials/search/:type')
  async credentialsSearch(
    @Headers('Authorization') auth: string,
    @Param('type') type: string,
    @Body() requestbody: any,
    @Res() response: Response,
  ) {
    const jwt = auth.replace('Bearer ', '');
    return this.portalService.credentialsSearch(
      jwt,
      type,
      requestbody,
      response,
    );
  }
  //credentialsIssue
  @Post('/credentials/issue')
  async credentialsIssue(
    @Headers('Authorization') auth: string,
    @Body() requestbody: any,
    @Res() response: Response,
  ) {
    const jwt = auth.replace('Bearer ', '');
    return this.portalService.credentialsIssue(jwt, requestbody, response);
  }
  //credentialsSchema
  @Get('/credentials/schema/:id')
  async credentialsSchema(@Param('id') id: string, @Res() response: Response) {
    return this.portalService.credentialsSchema(id, response);
  }
  //credentialsSchemaJSON
  @Get('/credentials/schema/json/:id')
  async credentialsSchemaJSON(
    @Param('id') id: string,
    @Res() response: Response,
  ) {
    return this.portalService.credentialsSchemaJSON(id, response);
  }
}
