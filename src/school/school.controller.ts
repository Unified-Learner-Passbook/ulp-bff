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
        'UDISE School API Working 9 May ' + adharencrypt + ' ' + deadharencrypt,
    };
    response.status(200).send(result);
  }
  //udiseDetail
  @Post('/verify')
  async udiseDetail(
    @Body('password') password: string,
    @Body('requestbody') requestbody: any,
    @Res() response: Response,
  ) {
    return this.schoolService.udiseDetail(password, requestbody, response);
  }
  //getStateList
  @Get('/stateList')
  async getStateList(@Res() response: Response) {
    return this.schoolService.getStateList(response);
  }
  //getDistrictList
  @Post('/districtList')
  async getDistrictList(@Body() requestbody: any, @Res() response: Response) {
    return this.schoolService.getDistrictList(requestbody, response);
  }
  //getBlockList
  @Post('/blockList')
  async getBlockList(@Body() requestbody: any, @Res() response: Response) {
    return this.schoolService.getBlockList(requestbody, response);
  }
  //getSchoolList
  @Post('/schoolList')
  async getSchoolList(@Body() requestbody: any, @Res() response: Response) {
    return this.schoolService.getSchoolList(requestbody, response);
  }
  //getSchoolMobileVerify
  @Post('/mobile/verify')
  async getSchoolMobileVerify(@Body() requestbody: any, @Res() response: Response) {
    return this.schoolService.getSchoolMobileVerify(requestbody, response);
  }
}
