import { Injectable, StreamableFile } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { AxiosRequestConfig } from 'axios';

//custom imports
import jwt_decode from 'jwt-decode';
import { createWriteStream, writeFile } from 'fs';
import { Response, Request } from 'express';
import * as wkhtmltopdf from 'wkhtmltopdf';
import { AadharService } from '../services/aadhar/aadhar.service';
import { SbrcService } from 'src/services/sbrc/sbrc.service';
import { CredService } from 'src/services/cred/cred.service';
import { KeycloakService } from 'src/services/keycloak/keycloak.service';
const qr = require('qrcode');
const { parse, HTMLElement } = require('node-html-parser');

const path = require('path');
import sharp from 'sharp';
import { join } from 'path';
import { log } from 'console';
const zlib = require('zlib');
const htmlMinifier = require('html-minifier');

const jsdom = require('jsdom');
const handlebars = require('handlebars');
const fs = require('fs');
const jQuery = require('jquery');
const cheerio = require('cheerio');

const minimize = require('minimize');

//for digilocker authorize
const randomstring = require('randomstring');
const crypto = require('crypto');
const base64url = require('base64url');
import { encode as base64encode } from 'base64-arraybuffer';

@Injectable()
export class SSOService {
  public codeVerifier: string;
  constructor(
    private readonly httpService: HttpService,
    private aadharService: AadharService,
    private sbrcService: SbrcService,
    private credService: CredService,
    private keycloakService: KeycloakService,
  ) {}
  //axios call
  md5 = require('md5');
  moment = require('moment');
  qs = require('qs');

  //getAadhaarEkyc
  async getAadhaarEkyc(response: Response, aadhaar_id: string) {
    if (aadhaar_id) {
      return response.status(200).send({
        success: true,
        status: 'aadhaar_api_success',
        message: 'Aadhar API Working',
        result: { uuid: aadhaar_id, otp: '1234' },
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
  //digilockerAuthorize
  async digilockerAuthorize(response: Response) {
    //console.log(request);
    let digi_client_id = 'LT46CF9CF7';
    let digi_url_call_back_uri = 'https://devulp.uniteframework.io/callback';
    //error
    //The code_challenge and code_challenge_method parameter is required
    //solution
    const state = randomstring.generate();
    const code_verifier = randomstring.generate(128);

    await this.generateCodeChallenge(code_verifier).then(async (challenge) => {
      console.log(challenge, 'challenge');
      // whatever you generated, example:
      // M5oPBP6RmJPh5QsGtx6ptVH7S2yjqt8sum96jBCyhZg

      const digiauthurl = await this.buildLoginUrl(
        state,
        digi_client_id,
        digi_url_call_back_uri,
        challenge,
      );

      response.status(200).send({
        digiauthurl: digiauthurl,
        state: state,
        code_verifier: code_verifier,
        challenge: challenge,
      });
    });
  }
  async generateCodeChallenge(codeVerifier) {
    const base64Digest = crypto
      .createHash('sha256')
      .update(codeVerifier)
      .digest('base64');
    const toBase64 = base64encode(base64Digest);
    // you can extract this replacing code to a function
    return base64Digest
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }
  async buildLoginUrl(state, client_id, redirect_uri, challenge) {
    const linkValue = new URL(
      'https://digilocker.meripehchaan.gov.in/public/oauth2/1/authorize',
    );

    const queryParams = {
      client_id,
      response_type: 'code',
      state,
      code_challenge: challenge,
      code_challenge_method: 'S256',
      redirect_uri,
    };

    for (const param in queryParams) {
      linkValue.searchParams.append(param, queryParams[param]);
    }
    return linkValue;
  }
  //digilockerToken
  async digilockerToken(
    response: Response,
    state: string,
    code_verifier: string,
    challenge: string,
    auth_code: string,
  ) {
    if (code_verifier && challenge && auth_code) {
      let digi_client_id = 'LT46CF9CF7';
      let digi_client_secret = 'de8ca4caee6a7b14c41f';
      let digi_url_call_back_uri = 'https://devulp.uniteframework.io/callback';

      //nesjs/axios
      var data = this.qs.stringify({
        code: auth_code,
        grant_type: 'authorization_code',
        client_id: digi_client_id,
        client_secret: digi_client_secret,
        redirect_uri: digi_url_call_back_uri,
        code_verifier: code_verifier,
      });

      const url =
        'https://digilocker.meripehchaan.gov.in/public/oauth2/2/token';

      const config: AxiosRequestConfig = {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      };

      let response_digi = null;
      try {
        const observable = this.httpService.post(url, data, config);
        const promise = observable.toPromise();
        const response = await promise;
        //console.log(JSON.stringify(response.data));
        response_digi = { data: response.data };
      } catch (e) {
        //console.log(e);
        response_digi = { error: null };
      }
      if (response_digi?.error) {
        return response.status(401).send({
          success: false,
          status: 'digilocker_token_bad_request',
          message: 'Unauthorized sub2',
          result: response_digi?.error,
        });
      } else {
        let id_token = response_digi?.data?.id_token;
        if (id_token) {
          let token_data: Object = await this.parseJwt(id_token);
          if (!token_data[0]?.sub) {
            return response.status(401).send({
              success: false,
              status: 'digilocker_token_bad_request',
              message: 'Unauthorized sub',
              result: response_digi?.error,
            });
          } else {
            const dob = await this.convertDate(token_data[0]?.birthdate);
            const username_name = token_data[0]?.given_name.split(' ')[0];
            const username_dob = await this.replaceChar(dob, '/', '');

            return response.status(200).send({
              success: true,
              status: 'digilocker_token_success',
              message: 'Digilocker Token Success',
              dob: dob,
              username_name: username_name,
              username_dob: username_dob,
              result: response_digi?.data,
            });
          }
        } else {
          return response.status(401).send({
            success: false,
            status: 'digilocker_token_bad_request',
            message: 'Unauthorized sub3',
            result: response_digi,
          });
        }
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
  //digilockerUser
  async digilockerUser(jwt: string, response: Response) {
    if (jwt) {
      //nesjs/axios

      const url = 'https://digilocker.meripehchaan.gov.in/public/oauth2/1/user';

      const config: AxiosRequestConfig = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + jwt,
        },
      };

      let response_digi = null;
      try {
        const observable = this.httpService.get(url, config);
        const promise = observable.toPromise();
        const response = await promise;
        //console.log(JSON.stringify(response.data));
        response_digi = { data: response.data };
      } catch (e) {
        //console.log(e);
        response_digi = { error: null };
      }
      if (response_digi?.error) {
        return response.status(401).send({
          success: false,
          status: 'digilocker_token_bad_request',
          message: 'Unauthorized sub2',
          result: response_digi?.error,
        });
      } else {
        return response.status(200).send({
          success: true,
          status: 'digilocker_user_success',
          message: 'Digilocker User Success',
          result: response_digi?.data,
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
  //digilockerFiles
  async digilockerFiles(jwt: string, response: Response) {
    if (jwt) {
      //nesjs/axios

      const url =
        'https://digilocker.meripehchaan.gov.in/public/oauth2/1/files';

      const config: AxiosRequestConfig = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + jwt,
        },
      };

      let response_digi = null;
      try {
        const observable = this.httpService.get(url, config);
        const promise = observable.toPromise();
        const response = await promise;
        //console.log(JSON.stringify(response.data));
        response_digi = { data: response.data };
      } catch (e) {
        //console.log(e);
        response_digi = { error: null };
      }
      if (response_digi?.error) {
        return response.status(401).send({
          success: false,
          status: 'digilocker_token_bad_request',
          message: 'Unauthorized sub2',
          result: response_digi?.error,
        });
      } else {
        return response.status(200).send({
          success: true,
          status: 'digilocker_user_success',
          message: 'Digilocker User Success',
          result: response_digi?.data,
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
  //digilockerFilesUpload
  async digilockerFilesUpload(jwt: string, response: Response) {
    if (jwt) {
      //nesjs/axios

      var data = this.qs.stringify({});

      const url =
        'https://digilocker.meripehchaan.gov.in/public/oauth2/1/file/upload/rushi';

      const config: AxiosRequestConfig = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + jwt,
        },
      };

      let response_digi = null;
      try {
        const observable = this.httpService.post(url, data, config);
        const promise = observable.toPromise();
        const response = await promise;
        //console.log(JSON.stringify(response.data));
        response_digi = { data: response.data };
      } catch (e) {
        console.log(e);
        response_digi = { error: null };
      }
      if (response_digi?.error) {
        return response.status(401).send({
          success: false,
          status: 'digilocker_token_bad_request',
          message: 'Unauthorized sub2',
          result: response_digi?.error,
        });
      } else {
        return response.status(200).send({
          success: true,
          status: 'digilocker_user_success',
          message: 'Digilocker User Success',
          result: response_digi?.data,
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
  //get convert date and repalce character from string
  async convertDate(datetime) {
    if (!datetime) {
      return '';
    }
    let date_string = datetime.substring(0, 10);
    const datetest = this.moment(date_string, 'DD/MM/YYYY').format(
      'DD/MM/YYYY',
    );
    return datetest;
  }
  async replaceChar(replaceString, found, replace) {
    if (!replaceString) {
      return '';
    }
    const search = found;
    const replaceWith = replace;
    const result = replaceString.split(search).join(replaceWith);
    return result;
  }
  //get jwt token information
  async parseJwt(token) {
    if (!token) {
      return [];
    }
    const decoded = jwt_decode(token);
    return [decoded];
  }
}
