import {
  Body,
  Controller,
  Param,
  Post,
  Query,
  Res,
  Get,
  Headers,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { LearnerService } from './learner.service';
import { Response } from 'express';
//import { UsersService } from 'src/services/users/users.service';

@Controller('v1/learner')
export class LearnerController {
  constructor(
    private readonly learnerService: LearnerService,
  ) 
  {}

  //learner
  //q1
  //register
  @Post('/q1/register')
  async registerQ1Learner(
    @Body('name') name: string,
    @Body('dob') dob: string,
    @Body('gender') gender: string,
    @Body('recoveryphone') recoveryphone: string,
    @Body('username') username: string,
    @Body('kyc_aadhaar_token') kyc_aadhaar_token: string,
    @Res() response: Response,
  ) {
    return this.learnerService.registerQ1Learner(
      name,
      dob,
      gender,
      recoveryphone,
      username,
      kyc_aadhaar_token,
      response,
    );
  }
  //q2
  //register
  @Post('/register')
  async registerLearner(
    @Body('name') name: string,
    @Body('dob') dob: string,
    @Body('gender') gender: string,
    @Body('recoveryphone') recoveryphone: string,
    @Body('username') username: string,
    @Res() response: Response,
  ) {
    return this.learnerService.registerLearner(
      name,
      dob,
      gender,
      recoveryphone,
      username,
      response,
    );
  }
  //aadhaar
  @Post('/aadhaar')
  async getAadhaarTokenLearner(
    @Headers('Authorization') auth: string,
    @Res() response: Response,
    @Body('aadhaar_id') aadhaar_id: string,
  ) {
    const jwt = auth.replace('Bearer ', '');
    return this.learnerService.getAadhaarTokenLearner(
      jwt,
      response,
      aadhaar_id,
    );
  }
  //get details
  @Get('/getdetail')
  async getDetailLearner(
    @Headers('Authorization') auth: string,
    @Res() response: Response,
  ) {
    const jwt = auth.replace('Bearer ', '');
    return this.learnerService.getDetailLearner(jwt, response);
  }
  //get digi details
  @Post('/digi/getdetail')
  async getDetailDigiLearner(
    @Headers('Authorization') auth: string,
    @Body('name') name: string,
    @Body('dob') dob: string,
    @Body('gender') gender: string,
    @Res() response: Response,
  ) {
    const jwt = auth.replace('Bearer ', '');
    return this.learnerService.getDetailDigiLearner(
      jwt,
      name,
      dob,
      gender,
      response,
    );
  }

}
