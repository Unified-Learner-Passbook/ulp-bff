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
import { AadharService } from '../services/aadhar/aadhar.service';

@Controller('v1/school')
export class SchoolController {
  constructor(
    private readonly schoolService: SchoolService,
    private aadharService: AadharService,
  ) {}

  @Get('/test')
  async getUser(@Res() response: Response) {
    const adharencrypt = await this.aadharService.encryptaadhaar('test_key');
    const deadharencrypt = await this.aadharService.decryptaadhaar(
      adharencrypt,
    );
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
