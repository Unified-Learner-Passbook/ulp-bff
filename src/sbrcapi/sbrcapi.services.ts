import { Injectable, StreamableFile } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { AxiosRequestConfig } from 'axios';

//custom imports
import { Response, Request } from 'express';
import { KeycloakService } from 'src/services/keycloak/keycloak.service';
import { SbrcService } from 'src/services/sbrc/sbrc.service';

@Injectable()
export class SbrcapiService {
  constructor(
    private readonly httpService: HttpService,
    private keycloakService: KeycloakService,
    private sbrcService: SbrcService,
  ) {}

  //getClientToken
  async getClientToken(password: string, response: Response) {
    if (password === 'test@4321') {
      const clientToken = await this.keycloakService.getClientToken();
      return response.status(200).send({
        success: true,
        token: clientToken?.access_token ? clientToken.access_token : null,
      });
    } else {
      response.status(200).send({ success: false, status: 'wrong_password' });
    }
  }

  //sbrcSearch
  async sbrcSearch(
    token: string,
    schema: string,
    filter: any,
    response: Response,
  ) {
    if (schema && filter) {
      const username = await this.keycloakService.verifyUserToken(token);
      if (username?.error) {
        return response.status(401).send({
          success: false,
          status: 'keycloak_token_bad_request',
          message: 'You do not have access for this request.',
          result: null,
        });
      } else if (!username?.preferred_username) {
        return response.status(401).send({
          success: false,
          status: 'keycloak_token_error',
          message: 'Your Login Session Expired.',
          result: null,
        });
      } else {
        //console.log('username', username);
        const sb_rc_search = await this.sbrcService.sbrcSearchEL(schema, {
          filters: filter,
        });
        //console.log('sb_rc_search', sb_rc_search);
        if (sb_rc_search?.error) {
          return response.status(501).send({
            success: false,
            status: 'sb_rc_search_error',
            message: 'Sunbird RC Search Failed',
            result: sb_rc_search?.error,
          });
        } else if (sb_rc_search.length === 0) {
          return response.status(404).send({
            success: false,
            status: 'sb_rc_search_no_found',
            message: 'Data Not Found in System.',
            result: null,
          });
        } else {
          return response.status(200).send({
            success: true,
            status: 'sbrc_search_success',
            message: 'SBRC Search Success',
            result: sb_rc_search,
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

  //sbrcDelete
  async sbrcDelete(
    token: string,
    schema: string,
    osid: string,
    response: Response,
  ) {
    if (schema && osid) {
      const username = await this.keycloakService.verifyUserToken(token);
      if (username?.error) {
        return response.status(401).send({
          success: false,
          status: 'keycloak_token_bad_request',
          message: 'You do not have access for this request.',
          result: null,
        });
      } else if (!username?.preferred_username) {
        return response.status(401).send({
          success: false,
          status: 'keycloak_token_error',
          message: 'Your Login Session Expired.',
          result: null,
        });
      } else {
        //console.log('username', username);
        const sb_rc_delete = await this.sbrcService.sbrcDeleteEL(schema, osid);
        //console.log('sb_rc_search', sb_rc_search);
        if (sb_rc_delete?.error) {
          return response.status(501).send({
            success: false,
            status: 'sb_rc_delete_error',
            message: 'Sunbird RC Delete Failed',
            result: sb_rc_delete?.error,
          });
        } else {
          return response.status(200).send({
            success: true,
            status: 'sbrc_delete_success',
            message: 'SBRC Delete Success',
            result: sb_rc_delete,
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
}
