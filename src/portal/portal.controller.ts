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
      message: 'Portal API Working 7 April',
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
}
