import { Injectable, StreamableFile } from '@nestjs/common';

import { HttpService } from '@nestjs/axios';
import { AxiosRequestConfig } from 'axios';

//custom imports
import { Response, Request } from 'express';
import { SbrcService } from '../services/sbrc/sbrc.service';
import { CredService } from 'src/services/cred/cred.service';
import { AadharService } from '../services/aadhar/aadhar.service';

@Injectable()
export class ClientService {
  constructor(
    private readonly httpService: HttpService,
    private sbrcService: SbrcService,
    private credService: CredService,
    private aadharService: AadharService,
  ) {}
  //axios call
  md5 = require('md5');
  crypto = require('crypto');
  fs = require('fs');
  x509 = require('x509.js');
  convert = require('json-to-plain-text');
  forge = require('node-forge');

  //registerClient
  async registerClient(requestbody: any, response: Response) {
    if (requestbody?.clientName) {
      //search in sb rc
      const filter = {
        filters: {
          clientName: {
            eq: requestbody?.clientName,
          },
        },
      };
      const sb_rc_search_detail = await this.sbrcService.sbrcSearchEL(
        'Client',
        filter,
      );
      //console.log(sb_rc_search_detail);
      if (sb_rc_search_detail?.error) {
        return response.status(501).send({
          success: false,
          status: 'sb_rc_search_error',
          message: 'System Search Error ! Please try again.',
          result: sb_rc_search_detail?.error,
        });
      } else if (sb_rc_search_detail.length === 0) {
        // no client found then register
        requestbody.clientId = await this.getClientId(requestbody?.clientName);
        requestbody.clientSecret = await this.getClientSecret(
          requestbody?.clientName,
        );
        // sunbird registery client
        let sb_rc_response_text = await this.sbrcService.sbrcInviteEL(
          requestbody,
          'Client',
        );
        if (sb_rc_response_text?.error) {
          return response.status(400).send({
            success: false,
            status: 'sb_rc_register_error',
            message: 'System Register Error ! Please try again.',
            result: sb_rc_response_text?.error,
          });
        } else if (sb_rc_response_text?.params?.status === 'SUCCESSFUL') {
          return response.status(200).send({
            success: true,
            status: 'sb_rc_registred',
            message: 'System Register Success.',
            result: null,
          });
        } else {
          return response.status(400).send({
            success: false,
            status: 'sb_rc_register_duplicate',
            message: 'Duplicate Data Found.',
            result: sb_rc_response_text,
          });
        }
      } else {
        return response.status(200).send({
          success: true,
          status: 'sb_rc_search_found',
          message: 'Data Found in System.',
          result: null,
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
  //searchClient
  async searchClient(clientName: string, response: Response) {
    if (clientName) {
      //search in sb rc//find if student private detaile
      const filter = {
        filters: {
          clientName: {
            eq: clientName,
          },
        },
      };
      const sb_rc_search_detail = await this.sbrcService.sbrcSearchEL(
        'Client',
        filter,
      );
      //console.log(sb_rc_search_detail);
      if (sb_rc_search_detail?.error) {
        return response.status(501).send({
          success: false,
          status: 'sb_rc_search_error',
          message: 'System Search Error ! Please try again.',
          result: sb_rc_search_detail?.error,
        });
      } else if (sb_rc_search_detail.length === 0) {
        // no client found then register
        return response.status(501).send({
          success: false,
          status: 'sb_rc_search_no_found',
          message: 'Data Not Found in System.',
          result: sb_rc_search_detail,
        });
      } else {
        return response.status(200).send({
          success: true,
          status: 'sb_rc_search_found',
          message: 'Data Found in System.',
          result: sb_rc_search_detail,
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
  //generate clientId
  async getClientId(clientName) {
    let length = 4;
    let chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    var result = '';
    for (var i = length; i > 0; --i)
      result += chars[Math.floor(Math.random() * chars.length)];
    let timestamp = Math.floor(Date.now() / 1000).toString();
    timestamp = timestamp.substr(timestamp.length - 5);
    result += timestamp;
    return result;
  }
  //generate clientSecret
  async getClientSecret(clientName) {
    let length = 10;
    let chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    var result = '';
    for (var i = length; i > 0; --i)
      result += chars[Math.floor(Math.random() * chars.length)];
    result += Math.floor(Date.now() / 1000).toString();
    return await this.md5(clientName + result);
  }

}
