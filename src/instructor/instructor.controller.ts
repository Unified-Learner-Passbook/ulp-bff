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
import { InstructorService } from './instructor.service';
import { Response } from 'express';
//import { UsersService } from 'src/services/users/users.service';

@Controller('v1/instructor')
export class InstructorController {
  constructor(
    private readonly instructorService: InstructorService,
  ) 
  {}

  //instructor
  //q1
  //register
  @Post('/q1/register')
  async registerQ1Instructor(
    @Body('name') name: string,
    @Body('dob') dob: string,
    @Body('gender') gender: string,
    @Body('recoveryphone') recoveryphone: string,
    @Body('issuer_did') issuer_did: string,
    @Body('username') username: string,
    @Body('email') email: string,
    @Body('kyc_aadhaar_token') kyc_aadhaar_token: string,
    @Body('school_name') school_name: string,
    @Body('school_id') school_id: string,
    @Body('school_mobile') school_mobile: string,
    @Res() response: Response,
  ) {
    return this.instructorService.registerQ1Instructor(
      name,
      dob,
      gender,
      recoveryphone,
      issuer_did,
      username,
      email,
      kyc_aadhaar_token,
      school_name,
      school_id,
      school_mobile,
      response,
    );
  }
  //q2
  //register
  @Post('/register')
  async registerInstructor(
    @Body('name') name: string,
    @Body('dob') dob: string,
    @Body('gender') gender: string,
    @Body('recoveryphone') recoveryphone: string,
    @Body('issuer_did') issuer_did: string,
    @Body('username') username: string,
    @Body('email') email: string,
    @Res() response: Response,
  ) {
    return this.instructorService.registerInstructor(
      name,
      dob,
      gender,
      recoveryphone,
      issuer_did,
      username,
      email,
      response,
    );
  }
  //aadhaar
  @Post('/aadhaar')
  async getAadhaarToken(
    @Headers('Authorization') auth: string,
    @Res() response: Response,
    @Body('aadhaar_id') aadhaar_id: string,
  ) {
    const jwt = auth.replace('Bearer ', '');
    return this.instructorService.getAadhaarTokenUpdate(
      jwt,
      response,
      aadhaar_id,
    );
  }
  //udise
  @Post('/udise')
  async getUDISEUpdate(
    @Headers('Authorization') auth: string,
    @Res() response: Response,
    @Body('school_name') school_name: string,
    @Body('school_id') school_id: string,
    @Body('school_mobile') school_mobile: string,
  ) {
    const jwt = auth.replace('Bearer ', '');
    return this.instructorService.getUDISEUpdate(
      jwt,
      response,
      school_name,
      school_id,
      school_mobile
    );
  }
  //get details
  @Get('/getdetail')
  async getDetailInstructor(
    @Headers('Authorization') auth: string,
    @Res() response: Response,
  ) {
    const jwt = auth.replace('Bearer ', '');
    return this.instructorService.getDetailInstructor(jwt, response);
  }
  //get digi details
  @Post('/digi/getdetail')
  async getDetailDigiInstructor(
    @Headers('Authorization') auth: string,
    @Body('name') name: string,
    @Body('dob') dob: string,
    @Body('gender') gender: string,
    @Res() response: Response,
  ) {
    const jwt = auth.replace('Bearer ', '');
    return this.instructorService.getDetailDigiInstructor(
      jwt,
      name,
      dob,
      gender,
      response,
    );
  }

}
