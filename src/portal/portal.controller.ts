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
}
