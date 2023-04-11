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
import { decryptaadhaar, encryptaadhaar } from '../utils/aadhaar/aadhaar_api';

@Controller('v1/school')
export class SchoolController {
  constructor(private readonly schoolService: SchoolService) {}

  @Get('/test')
  async getUser(@Res() response: Response) {
    const adharencrypt = await encryptaadhaar('rushi');
    const deadharencrypt = await decryptaadhaar(adharencrypt);
    const result = {
      success: true,
      message:
        'School API Working 31 March ' + adharencrypt + ' ' + deadharencrypt,
    };
    response.status(200).send(result);
  }
  @Post('/authenticate')
  async aadhaarVerify(@Body() requestbody: any, @Res() response: Response) {
    return this.schoolService.schoolVerify(requestbody, response);
  }
}
