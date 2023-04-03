import { Injectable, StreamableFile } from '@nestjs/common';

//custom imports
import axios from 'axios';
import { Response, Request } from 'express';

@Injectable()
export class PublicSchoolService {
  //axios call
  md5 = require('md5');
  crypto = require('crypto');
  fs = require('fs');
  x509 = require('x509.js');
  convert = require('json-to-plain-text');
  forge = require('node-forge');

  //registerPublicSchool
  async registerPublicSchool(requestbody: any, response: Response) {
    if (requestbody?.udiseCode) {
      //search in sb rc//find if student private detaile
      const filter = {
        filters: {
          udiseCode: {
            eq: requestbody?.udiseCode,
          },
        },
      };
      const sb_rc_search_detail = await this.searchEntity(
        'PublicSchool',
        filter,
      );
      //console.log(sb_rc_search_detail);
      if (sb_rc_search_detail?.error) {
        return response.status(501).send({
          success: false,
          status: 'sb_rc_search_error',
          message: 'Sunbird Search Failed',
          result: sb_rc_search_detail?.error,
        });
      } else if (sb_rc_search_detail.length === 0) {
        // no public school found then register
        requestbody.clientId = await this.getClientId(requestbody?.udiseCode);
        requestbody.clientSecret = await this.getClientSecret(
          requestbody?.udiseCode,
        );
        // sunbird registery public school
        let sb_rc_response_text = await this.sbrcInvite(
          requestbody,
          'PublicSchool',
        );
        if (sb_rc_response_text?.error) {
          return response.status(400).send({
            success: false,
            status: 'sb_rc_register_error',
            message: 'Sunbird RC Registration Failed',
            result: sb_rc_response_text?.error,
          });
        } else if (sb_rc_response_text?.params?.status === 'SUCCESSFUL') {
          return response.status(200).send({
            success: true,
            status: 'sb_rc_registred',
            message: 'Public School Registered in Subird RC',
            result: null,
          });
        } else {
          return response.status(400).send({
            success: false,
            status: 'sb_rc_register_duplicate',
            message: 'Student Already Registered in Sunbird RC',
            result: sb_rc_response_text,
          });
        }
      } else {
        return response.status(200).send({
          success: true,
          status: 'sb_rc_search_found',
          message: 'Public School Already Found in Subird RC',
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
  //searchPublicSchool
  async searchPublicSchool(udiseCode: string, response: Response) {
    if (udiseCode) {
      //search in sb rc//find if student private detaile
      const filter = {
        filters: {
          udiseCode: {
            eq: udiseCode,
          },
        },
      };
      const sb_rc_search_detail = await this.searchEntity(
        'PublicSchool',
        filter,
      );
      //console.log(sb_rc_search_detail);
      if (sb_rc_search_detail?.error) {
        return response.status(501).send({
          success: false,
          status: 'sb_rc_search_error',
          message: 'Sunbird Search Failed',
          result: sb_rc_search_detail?.error,
        });
      } else if (sb_rc_search_detail.length === 0) {
        // no public school found then register
        return response.status(501).send({
          success: false,
          status: 'sb_rc_search_no_found',
          message: 'Sunbird Search No Found',
          result: sb_rc_search_detail,
        });
      } else {
        return response.status(200).send({
          success: true,
          status: 'sb_rc_search_found',
          message: 'Public School Already Found in Subird RC',
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
  async getClientId(udiseCode) {
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
  async getClientSecret(udiseCode) {
    let length = 10;
    let chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    var result = '';
    for (var i = length; i > 0; --i)
      result += chars[Math.floor(Math.random() * chars.length)];
    result += Math.floor(Date.now() / 1000).toString();
    return await this.md5(udiseCode + result);
  }

  // invite entity in registery
  async sbrcInvite(inviteSchema, entityName) {
    let data = JSON.stringify(inviteSchema);

    let config_sb_rc = {
      method: 'post',
      url: process.env.REGISTRY_URL + 'api/v1/' + entityName + '/invite',
      headers: {
        'content-type': 'application/json',
      },
      data: data,
    };

    var sb_rc_response_text = null;
    await axios(config_sb_rc)
      .then(function (response) {
        //console.log(JSON.stringify(response.data));
        sb_rc_response_text = response.data;
      })
      .catch(function (error) {
        //console.log(error);
        sb_rc_response_text = { error: error };
      });

    return sb_rc_response_text;
  }
  //searchEntity
  async searchEntity(entity: string, filter: any) {
    let data = JSON.stringify(filter);

    let url = process.env.REGISTRY_URL + 'api/v1/' + entity + '/search';
    //console.log(data + ' ' + url);
    let config = {
      method: 'post',
      url: url,
      headers: {
        'Content-Type': 'application/json',
      },
      data: data,
    };
    let sb_rc_search = null;
    await axios(config)
      .then(function (response) {
        //console.log(JSON.stringify(response.data));
        sb_rc_search = response.data;
      })
      .catch(function (error) {
        //console.log(error);
        sb_rc_search = { error: error };
      });
    return sb_rc_search;
  }
}
