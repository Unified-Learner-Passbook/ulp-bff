import { Injectable, StreamableFile } from '@nestjs/common';

//custom imports
import axios from 'axios';
import { Response, Request } from 'express';

@Injectable()
export class AadhaarService {
  //axios call
  md5 = require('md5');

  //aadhaarVerify
  async aadhaarVerify(aadhaar_id: string, response: Response) {
    if (aadhaar_id) {
      const aadhaar_token = await this.md5(aadhaar_id + '_token');
      return response.status(200).send({
        success: true,
        status: 'aadhaar_success',
        message: 'Aadhaar Success',
        result: {
          aadhaar_token: aadhaar_token,
        },
      });
    } else {
      return response.status(400).send({
        success: false,
        status: 'invalid_request',
        message: 'Invalid Request. Not received All Parameters.',
        result: null,
      });
    }
  }
}
