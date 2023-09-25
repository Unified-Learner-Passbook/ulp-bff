import {
  Controller,
  Get,
  Post,
  Res,
  Headers,
  Body,
  Put,
  Head,
} from '@nestjs/common';
import { GrievanceService } from './grievance.service';
import { Response, response } from 'express';

@Controller('v1/grievance')
export class GrievanceController {
  constructor(private readonly grievanceService: GrievanceService) {}

  @Get('/test')
  async test() {
    return this.grievanceService.test();
  }
  @Post('/sent')
  async sent(
    @Headers('Authorization') auth: string,
    @Body('credential_schema_id') credential_schema_id: string,
    @Body('grv_school_id') grv_school_id: string,
    @Body('grv_school_name') grv_school_name: string,
    @Body('grvSubject') grvSubject: string,
    @Body('grvDesc') grvDesc: string,
    @Res() response: Response,
  ) {
    const jwt = auth.replace('Bearer ', '');
    return this.grievanceService.sent(
      jwt,
      credential_schema_id,
      grv_school_id,
      grv_school_name,
      grvSubject,
      grvDesc,
      response,
    );
  }
  @Post('/search')
  async search(
    @Headers('Authorization') auth: string,
    @Body('type') type: string,
    @Res() response: Response,
  ) {
    const jwt = auth.replace('Bearer ', '');
    return this.grievanceService.search(jwt, type, response);
  }
  @Put('/reply')
  async reply(
    @Headers('Authorization') auth: string,
    @Body('grv_os_id') grv_os_id: string,

    @Res() response: Response,
  ) {
    const jwt = auth.replace('Bearer ', '');
    return this.grievanceService.reply(jwt, grv_os_id, response);
  }
}
