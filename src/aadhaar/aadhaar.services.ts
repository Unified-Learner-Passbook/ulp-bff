import { Injectable, StreamableFile } from '@nestjs/common';

//custom imports
import axios from 'axios';
import { Response, Request } from 'express';

@Injectable()
export class AadhaarService {
  //axios call
  md5 = require('md5');
  addhar_aua_url = 'https://uatauakua.auashreetron.com/clientgwapi';

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
  //aadhaarDemographic
  async aadhaarDemographic(
    aadhaar_id: string,
    aadhaar_name: string,
    response: Response,
  ) {
    if (aadhaar_id && aadhaar_name) {
      const rrn = await this.getRRN();
      //call gov api
      let data = {
        AUAKUAParameters: {
          LAT: '17.494568',
          LONG: '78.392056',
          DEVMACID: '11:22:33:44:55',
          DEVID: 'F0178BF2AA61380FBFF0',
          CONSENT: 'Y',
          SHRC: 'Y',
          VER: '2.5',
          SERTYPE: '07',
          ENV: '2',
          SLK: 'LIPCR-SYMQL-KOXVX-WVJZR',
          RRN: rrn,
          REF: 'FROMSAMPLE',
          UDC: '',
          ISPA: 'false',
          ISPFA: 'false',
          ISPI: 'true',
          NAME: aadhaar_name,
          AADHAARID: aadhaar_id,
        },
        PIDXml: '',
        Environment: '0',
      };

      let config = {
        method: 'post',
        url: this.addhar_aua_url + '/api/Aadhaar/DoDemoAuth',
        headers: {
          'Content-Type': 'application/json',
        },
        data: data,
      };
      console.log('config', config);
      let response_text = null;
      await axios(config)
        .then(function (response) {
          console.log(JSON.stringify(response.data));
          response_text = response.data;
        })
        .catch(function (error) {
          //console.log(error);
          response_text = { error: error };
        });
      if (response_text?.error) {
        return response.status(200).send({
          success: false,
          status: 'aadhaar_error',
          message: 'Aadhaar Error',
          result: response_text?.error,
        });
      } else {
        const responseXML = response_text?.responseXML;
        const decodedxml = Buffer.from(responseXML, 'base64').toString('utf8');
        return response.status(200).send({
          success: true,
          status: 'aadhaar_success',
          message: 'Aadhaar Success',
          result: response_text,
          decodedxml: decodedxml,
        });
      }
    } else {
      return response.status(400).send({
        success: false,
        status: 'invalid_request',
        message: 'Invalid Request. Not received All Parameters.',
        result: null,
      });
    }
  }

  //aadhaarAuthSentOTP
  async aadhaarAuthSentOTP(aadhaar_id: string, response: Response) {
    if (aadhaar_id) {
      const rrn = await this.getRRN();
      //call gov api
      let data = {
        AUAKUAParameters: {
          LAT: '17.494568',
          LONG: '78.392056',
          DEVMACID: '11:22:33:44:55',
          DEVID: 'F0178BF2AA61380FBFF0',
          CONSENT: 'Y',
          SHRC: 'Y',
          VER: '2.5',
          SERTYPE: '09',
          ENV: '2',
          CH: '0',
          AADHAARID: aadhaar_id,
          SLK: 'LIPCR-SYMQL-KOXVX-WVJZR',
          RRN: rrn,
          REF: 'FROMSAMPLE',
          UDC: '',
        },
        PIDXml: '',
        Environment: '0',
      };

      let config = {
        method: 'post',
        url: this.addhar_aua_url + '/api/Aadhaar/GenerateOTP',
        headers: {
          'Content-Type': 'application/json',
        },
        data: data,
      };
      console.log('config', config);
      let response_text = null;
      await axios(config)
        .then(function (response) {
          console.log(JSON.stringify(response.data));
          response_text = response.data;
        })
        .catch(function (error) {
          //console.log(error);
          response_text = { error: error };
        });
      if (response_text?.error) {
        return response.status(200).send({
          success: false,
          status: 'aadhaar_error',
          message: 'Aadhaar Error',
          result: response_text?.error,
        });
      } else {
        const responseXML = response_text?.responseXML;
        const decodedxml = Buffer.from(responseXML, 'base64').toString('utf8');

        return response.status(200).send({
          success: true,
          status: 'aadhaar_success',
          message: 'Aadhaar Success',
          result: response_text,
          decodedxml: decodedxml,
        });
      }
    } else {
      return response.status(400).send({
        success: false,
        status: 'invalid_request',
        message: 'Invalid Request. Not received All Parameters.',
        result: null,
      });
    }
  }

  //aadhaarAuthVerifyOTP
  async aadhaarAuthVerifyOTP(
    aadhaar_id: string,
    aadhaar_otp: string,
    aadhaar_txn: string,
    response: Response,
  ) {
    if (aadhaar_id && aadhaar_otp) {
      const rrn = await this.getRRN();
      //call gov api
      let data = {
        AUAKUAParameters: {
          LAT: '17.494568',
          LONG: '78.392056',
          DEVMACID: '11:22:33:44:55',
          DEVID: 'F0178BF2AA61380FBFF0',
          CONSENT: 'Y',
          SHRC: 'Y',
          VER: '2.5',
          SERTYPE: '02',
          ENV: '2',
          OTP: aadhaar_otp,
          AADHAARID: aadhaar_id,
          SLK: 'LIPCR-SYMQL-KOXVX-WVJZR',
          RRN: rrn,
          TXN: aadhaar_txn,
          REF: 'FROMSAMPLE',
          UDC: '',
        },
        PIDXml: '',
        Environment: '0',
      };

      let config = {
        method: 'post',
        url: this.addhar_aua_url + '/api/Aadhaar/AUTHWithOTP',
        headers: {
          'Content-Type': 'application/json',
        },
        data: data,
      };
      console.log('config', config);
      let response_text = null;
      await axios(config)
        .then(function (response) {
          console.log(JSON.stringify(response.data));
          response_text = response.data;
        })
        .catch(function (error) {
          //console.log(error);
          response_text = { error: error };
        });
      if (response_text?.error) {
        return response.status(200).send({
          success: false,
          status: 'aadhaar_error',
          message: 'Aadhaar Error',
          result: response_text?.error,
        });
      } else {
        const responseXML = response_text?.responseXML;
        const decodedxml = Buffer.from(responseXML, 'base64').toString('utf8');

        return response.status(200).send({
          success: true,
          status: 'aadhaar_success',
          message: 'Aadhaar Success',
          result: response_text,
          decodedxml: decodedxml,
        });
      }
    } else {
      return response.status(400).send({
        success: false,
        status: 'invalid_request',
        message: 'Invalid Request. Not received All Parameters.',
        result: null,
      });
    }
  }
  //helper function
  //generate rrn
  async getRRN() {
    let length = 20;
    let chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    var result = '';
    for (var i = length; i > 0; --i)
      result += chars[Math.floor(Math.random() * chars.length)];
    let timestamp = Math.floor(Date.now() / 1000).toString();
    result += timestamp;
    return result;
  }
}
