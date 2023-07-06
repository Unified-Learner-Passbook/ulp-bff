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
import { SbrcapiService } from './sbrcapi.services';

@Controller('v1/sbrc')
export class SbrcController {
  constructor(private readonly sbrcapiService: SbrcapiService) {}

  @Get('/test')
  async getUser(@Res() response: Response) {
    const result = {
      success: true,
      message: 'sbrc api 5 june',
    };
    response.status(200).send(result);
  }
  //getClientToken
  @Post('/token')
  async getClientToken(
    @Body('password') password: string,
    @Res() response: Response,
  ) {
    return this.sbrcapiService.getClientToken(password, response);
  }
  //sbrcSearch
  @Post('/search')
  async sbrcSearch(
    @Headers('Authorization') auth: string,
    @Body('schema') schema: string,
    @Body('filter') filter: any,
    @Res() response: Response,
  ) {
    const jwt = auth.replace('Bearer ', '');
    return this.sbrcapiService.sbrcSearch(jwt, schema, filter, response);
  }
  //sbrcDelete
  @Post('/delete')
  async sbrcDelete(
    @Headers('Authorization') auth: string,
    @Body('schema') schema: string,
    @Body('osid') osid: string,
    @Res() response: Response,
  ) {
    const jwt = auth.replace('Bearer ', '');
    return this.sbrcapiService.sbrcDelete(jwt, schema, osid, response);
  }
  //accountdelete
  @Post('/accountdelete')
  async sbrcAccountDelete(
    @Headers('Authorization') auth: string,
    @Body('aadhaar_list') aadhaar_list: any,
    @Res() response: Response,
  ) {
    const jwt = auth.replace('Bearer ', '');
    return this.sbrcapiService.sbrcAccountDelete(jwt, aadhaar_list, response);
  }
}
