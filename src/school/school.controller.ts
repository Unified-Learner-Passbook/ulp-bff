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
import { SchoolService } from './school.services';

@Controller('v1/school')
export class SchoolController {
  constructor(private readonly schoolService: SchoolService) {}

  @Get('/test')
  getUser(@Res() response: Response) {
    const result = {
      success: true,
      message: 'School API Working 31 March',
    };
    response.status(200).send(result);
  }
  @Post('/authenticate')
  async aadhaarVerify(@Body() requestbody: any, @Res() response: Response) {
    return this.schoolService.schoolVerify(requestbody, response);
  }
}
