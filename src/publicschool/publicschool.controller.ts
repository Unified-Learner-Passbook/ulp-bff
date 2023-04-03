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
import { PublicSchoolService } from './publicschool.services';

@Controller('v1/publicschool')
export class PublicSchoolController {
  constructor(private readonly publicschoolService: PublicSchoolService) {}

  @Get('/test')
  getUser(@Res() response: Response) {
    const result = {
      success: true,
      message: 'Public School API Working 3 April',
    };
    response.status(200).send(result);
  }
  @Post('/register')
  async registerPublicSchool(
    @Body() requestbody: any,
    @Res() response: Response,
  ) {
    return this.publicschoolService.registerPublicSchool(requestbody, response);
  }
  @Post('/search')
  async searchPublicSchool(
    @Body('udiseCode') udiseCode: string,
    @Res() response: Response,
  ) {
    return this.publicschoolService.searchPublicSchool(udiseCode, response);
  }
  @Post('/bulk/register')
  async bulkRegister(
    @Body('clientId') clientId: string,
    @Body('clientSecret') clientSecret: string,
    @Res() response: Response,
  ) {
    return this.publicschoolService.bulkRegister(
      clientId,
      clientSecret,
      response,
    );
  }
}
