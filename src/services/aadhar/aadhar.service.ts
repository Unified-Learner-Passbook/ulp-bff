import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { AxiosRequestConfig } from 'axios';
var parser = require('xml2json');
var md5 = require('md5');

const addhar_aua_url = 'https://uatauakua.auashreetron.com/clientgwapi';

@Injectable()
export class AadharService {
  constructor(private readonly httpService: HttpService) {}
  //moment call
  moment = require('moment');
  //aadhaarDemographic
  async aadhaarDemographic(
    aadhaar_id: string,
    aadhaar_name: string,
    aadhaar_dob: string,
    aadhaar_gender: string,
  ) {
    if (aadhaar_id && aadhaar_name && aadhaar_dob && aadhaar_gender) {
      //encrypt it
      //let uuid = await md5(aadhaar_id + '_token');
      //pass as it is
      let uuid = aadhaar_id;

      let response_text = null;
      response_text = {
        success: true,
        status: 'aadhaar_success',
        message: 'Aadhaar Verification Completed Successfully.',
        result: {
          ret: 'y',
          code: '80796040edc9414287bf035becc4f9a3',
          txn: '0047233106f084e762ce450a9c1486eddfe602c1',
          ts: '2023-04-08T16:25:48.865+05:30',
          err: '000',
          errdesc: '',
          rrn: 'PUBDVUQYRXW806F736YF1680951344',
          ref: 'FROMSAMPLE',
          responseXML:
            'PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz48QXV0aFJlcyBjb2RlPSI4MDc5NjA0MGVkYzk0MTQyODdiZjAzNWJlY2M0ZjlhMyIgaW5mbz0iMDR7MDExMTE3NDVTT3Y0RExBY3ovaUcwZiswUzZ0dDN1ejRJKzlLNGFCS0toUVRxUFk3MVozQU9ETWowOVN1VStyUDlPOGp2aDU4LEEsODA4YjE1OTc5MTM0YzJhNDk3MzNjNjMwNjgxYTVkZTA0MmFmZWY1MjRlNmRhYmFhOGQxYjE0YjBhOGJlYmUwNCwwMTgwMDAwMDA4MDAwMDEwLDIuMCwyMDIzMDQwODE2MjQ1OSwwLDAsMCwwLDIuNSxlZTI5NDMwMjMxNGIzZDRmZDBlMDdkYzJjNDMwNDk1NDgxNGI5NDlhNzExNjk5YjVhYjQ5Mjg5NTRmYWJmZDRjLDAyY2Q2M2FkOTI3NzdmMGU1MmYwMjYyM2ZmYjYzMThhOTEyMTY3M2MzNTFjMWMyNGM3MTk3YjdjNDJkY2YzMzEsNWFkNTVmOThhZjU4MDhiMDVlNjZhM2FhZDZkMzdjNDU4ZjQxN2I3NTZhZTI5YTcyZjQ1Y2MwY2ZjODUyMmM4OCwyMyxFLDEwMCxOQSxOQSxOQSxOQSxOQSxOQSxOQSwsTkEsTkEsTkEsTkEsTkEsTkF9IiByZXQ9InkiIHRzPSIyMDIzLTA0LTA4VDE2OjI1OjQ4Ljg2NSswNTozMCIgdHhuPSIwMDQ3MjMzMTA2ZjA4NGU3NjJjZTQ1MGE5YzE0ODZlZGRmZTYwMmMxIiB1dWlkPSI2MzgxNjU2NzkwMzY0Nzc3MTQiPjxTaWduYXR1cmUgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvMDkveG1sZHNpZyMiPjxTaWduZWRJbmZvPjxDYW5vbmljYWxpemF0aW9uTWV0aG9kIEFsZ29yaXRobT0iaHR0cDovL3d3dy53My5vcmcvVFIvMjAwMS9SRUMteG1sLWMxNG4tMjAwMTAzMTUiIC8+PFNpZ25hdHVyZU1ldGhvZCBBbGdvcml0aG09Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvMDkveG1sZHNpZyNyc2Etc2hhMSIgLz48UmVmZXJlbmNlIFVSST0iIj48VHJhbnNmb3Jtcz48VHJhbnNmb3JtIEFsZ29yaXRobT0iaHR0cDovL3d3dy53My5vcmcvMjAwMC8wOS94bWxkc2lnI2VudmVsb3BlZC1zaWduYXR1cmUiIC8+PC9UcmFuc2Zvcm1zPjxEaWdlc3RNZXRob2QgQWxnb3JpdGhtPSJodHRwOi8vd3d3LnczLm9yZy8yMDAxLzA0L3htbGVuYyNzaGEyNTYiIC8+PERpZ2VzdFZhbHVlPmVNRmppeTloOEVXVUJhZWZzQzltaWVrMHFsKytvNDhCbS9RRjl1d2VvVmc9PC9EaWdlc3RWYWx1ZT48L1JlZmVyZW5jZT48L1NpZ25lZEluZm8+PFNpZ25hdHVyZVZhbHVlPlJheEF1RVJiUHJzRnNmMjJMQ3JMajNSVDNnREEvNzRkT2UreFFzeGhuaDI0dlhXTGxyNjBydVR5SGhwazNBMkptYnl4K2JjVUwweVIKRFRNdWtOVHFJT0R5MGViQ1RuOCt3M1NLV0E1ZlNmTXdJQWZtd0Vac09hQS9tejRsVnhSTVl5b3hCL0c5cS80cllSTTRRc0pIbUM5TgoyQ1VGVHZNMHUxaW1lUE41NVJDdHRNYW52bzJISW9NdWJkRHIrdkF1NkxMdHA1UC9Pb2VMZmg2b1RYTDdaRnpzQmxtL2dxdS83blQ0CmMxTS8yTUZROGd2M1pzRFdkUjY4SzZNbkhycGpZWmZleWJRbzJPQi9MOTBIOGdwM0RxR2V5NnV4R0JSdnozMXNodnlzajcyZ3hMT2cKSWVsMDRRa0FXaEFtMW5VOHpNU1E5MG5JOWNZUEsxQTBEbEF0N1E9PTwvU2lnbmF0dXJlVmFsdWU+PC9TaWduYXR1cmU+PC9BdXRoUmVzPg==',
        },
        decodedxml:
          '<?xml version="1.0" encoding="UTF-8"?><AuthRes code="80796040edc9414287bf035becc4f9a3" info="04{01111745SOv4DLAcz/iG0f+0S6tt3uz4I+9K4aBKKhQTqPY71Z3AODMj09SuU+rP9O8jvh58,A,808b15979134c2a49733c630681a5de042afef524e6dabaa8d1b14b0a8bebe04,0180000008000010,2.0,20230408162459,0,0,0,0,2.5,ee294302314b3d4fd0e07dc2c4304954814b949a711699b5ab4928954fabfd4c,02cd63ad92777f0e52f02623ffb6318a9121673c351c1c24c7197b7c42dcf331,5ad55f98af5808b05e66a3aad6d37c458f417b756ae29a72f45cc0cfc8522c88,23,E,100,NA,NA,NA,NA,NA,NA,NA,,NA,NA,NA,NA,NA,NA}" ret="y" ts="2023-04-08T16:25:48.865+05:30" txn="0047233106f084e762ce450a9c1486eddfe602c1" uuid="' +
          uuid +
          '"><Signature xmlns="http://www.w3.org/2000/09/xmldsig#"><SignedInfo><CanonicalizationMethod Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315" /><SignatureMethod Algorithm="http://www.w3.org/2000/09/xmldsig#rsa-sha1" /><Reference URI=""><Transforms><Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature" /></Transforms><DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256" /><DigestValue>eMFjiy9h8EWUBaefsC9miek0ql++o48Bm/QF9uweoVg=</DigestValue></Reference></SignedInfo><SignatureValue>RaxAuERbPrsFsf22LCrLj3RT3gDA/74dOe+xQsxhnh24vXWLlr60ruTyHhpk3A2Jmbyx+bcUL0yR\n' +
          'DTMukNTqIODy0ebCTn8+w3SKWA5fSfMwIAfmwEZsOaA/mz4lVxRMYyoxB/G9q/4rYRM4QsJHmC9N\n' +
          '2CUFTvM0u1imePN55RCttManvo2HIoMubdDr+vAu6LLtp5P/OoeLfh6oTXL7ZFzsBlm/gqu/7nT4\n' +
          'c1M/2MFQ8gv3ZsDWdR68K6MnHrpjYZfeybQo2OB/L90H8gp3DqGey6uxGBRvz31shvysj72gxLOg\n' +
          'Iel04QkAWhAm1nU8zMSQ90nI9cYPK1A0DlAt7Q==</SignatureValue></Signature></AuthRes>',
      };
      return response_text;

      //call gov api
      const aadhaar_dob_format = await this.getAadhaarDobFormat(aadhaar_dob);
      const rrn = await this.getRRN();
      let data = JSON.stringify({
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
          PIGENDER: aadhaar_gender,
          PIDOB: aadhaar_dob_format,
          AADHAARID: aadhaar_id,
        },
        PIDXml: '',
        Environment: '0',
      });
      const url = addhar_aua_url + '/api/Aadhaar/DoDemoAuth';
      const config: AxiosRequestConfig = {
        headers: {
          'Content-Type': 'application/json',
        },
      };
      try {
        const observable = this.httpService.post(url, data, config);
        const promise = observable.toPromise();
        const response = await promise;
        //console.log(JSON.stringify(response.data));
        response_text = response.data;
      } catch (e) {
        //console.log(e);
        response_text = { error: e };
      }

      if (response_text?.error) {
        return {
          success: false,
          status: 'aadhaar_error',
          message: 'Aadhaar Verification Failed.',
          result: response_text?.error,
        };
      } else {
        console.log('response_text', response_text);
        const responseXML = response_text?.responseXML;
        const decodedxml = Buffer.from(responseXML, 'base64').toString('utf8');
        return {
          success: true,
          status: 'aadhaar_success',
          message: 'Aadhaar Verification Completed Successfully.',
          result: response_text,
          decodedxml: decodedxml,
        };
      }
    } else {
      return {
        success: false,
        status: 'invalid_request',
        message: 'Invalid Request. Not received All Parameters.',
        result: null,
      };
    }
  }

  //aadhaarAuthSentOTP
  async aadhaarAuthSentOTP(aadhaar_id: string) {
    if (aadhaar_id) {
      //call gov api
      const rrn = await this.getRRN();
      let data = JSON.stringify({
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
      });

      const url = addhar_aua_url + '/api/Aadhaar/GenerateOTP';
      const config: AxiosRequestConfig = {
        headers: {
          'Content-Type': 'application/json',
        },
      };
      //console.log('config', config);
      let response_text = null;
      try {
        const observable = this.httpService.post(url, data, config);
        const promise = observable.toPromise();
        const response = await promise;
        //console.log(JSON.stringify(response.data));
        response_text = response.data;
      } catch (e) {
        //console.log(e);
        response_text = { error: e };
      }

      if (response_text?.error) {
        return {
          success: false,
          status: 'aadhaar_error',
          message: 'Aadhaar Verification Failed.',
          result: response_text?.error,
        };
      } else {
        const responseXML = response_text?.responseXML;
        const decodedxml = Buffer.from(responseXML, 'base64').toString('utf8');

        return {
          success: true,
          status: 'aadhaar_success',
          message: 'Aadhaar Verification Completed Successfully.',
          result: response_text,
          decodedxml: decodedxml,
        };
      }
    } else {
      return {
        success: false,
        status: 'invalid_request',
        message: 'Invalid Request. Not received All Parameters.',
        result: null,
      };
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
      //call gov api
      const rrn = await this.getRRN();
      let data = JSON.stringify({
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
      });

      const url = addhar_aua_url + '/api/Aadhaar/AUTHWithOTP';
      const config: AxiosRequestConfig = {
        headers: {
          'Content-Type': 'application/json',
        },
      };
      //console.log('config', config);
      let response_text = null;
      try {
        const observable = this.httpService.post(url, data, config);
        const promise = observable.toPromise();
        const response = await promise;
        //console.log(JSON.stringify(response.data));
        response_text = response.data;
      } catch (e) {
        //console.log(e);
        response_text = { error: e };
      }

      if (response_text?.error) {
        return {
          success: false,
          status: 'aadhaar_error',
          message: 'Aadhaar Verification Failed.',
          result: response_text?.error,
        };
      } else {
        const responseXML = response_text?.responseXML;
        const decodedxml = Buffer.from(responseXML, 'base64').toString('utf8');

        return {
          success: true,
          status: 'aadhaar_success',
          message: 'Aadhaar Verification Completed Successfully.',
          result: response_text,
          decodedxml: decodedxml,
        };
      }
    } else {
      return {
        success: false,
        status: 'invalid_request',
        message: 'Invalid Request. Not received All Parameters.',
        result: null,
      };
    }
  }

  //getUUID
  async getUUID(xmldata) {
    try {
      var json = parser.toJson(xmldata);
      //console.log(json);
      const jsonobj = JSON.parse(json);
      return jsonobj?.AuthRes?.uuid ? jsonobj.AuthRes.uuid : null;
    } catch (e) {
      return null;
    }
  }

  //encryptaadhaar
  async encryptaadhaar(aadhaar_enc_text) {
    try {
      let data = aadhaar_enc_text;
      let buff = new Buffer(data);
      let base64data = buff.toString('base64');
      return base64data;
    } catch (e) {
      console.log(e);
      return 'e';
    }
  }

  //decryptaadhaar
  async decryptaadhaar(aadhaar_dec_text) {
    try {
      let data = aadhaar_dec_text;
      let buff = new Buffer(data, 'base64');
      let text = buff.toString('ascii');
      return text;
    } catch (e) {
      console.log(e);
      return '';
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
  //getAadhaarDobFormat
  async getAadhaarDobFormat(aadhaar_dob) {
    if (aadhaar_dob) {
      try {
        const datetest = this.moment(aadhaar_dob, 'DD/MM/YYYY').format(
          'YYYY-MM-DD',
        );
        return datetest;
      } catch (e) {
        return '';
      }
    } else {
      return '';
    }
  }
}
