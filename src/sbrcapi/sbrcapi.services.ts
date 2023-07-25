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

  qs = require('qs');

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

  //sbrcAccountDelete
  async sbrcAccountDelete(
    token: string,
    aadhaar_list: any,
    response: Response,
  ) {
    if (aadhaar_list) {
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
        await this.ulpQ2DeleteAccount(token, aadhaar_list, response);
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
  //delete account
  async ulpQ2DeleteAccount(
    token: string,
    aadhaar_list: any,
    response: Response,
  ): Promise<any> {
    let response_array = [];
    for (let i = 0; i < aadhaar_list.length; i++) {
      response_array[i] = {};
      response_array[i].aadhaar_token = aadhaar_list[i];
      try {
        let aadhaar_token = aadhaar_list[i];
        console.log('################');
        console.log('aadhaar_token', aadhaar_token);
        //search student
        let search_response = await new Promise<any>(async (done) => {
          const data = JSON.stringify({
            filters: {
              aadhaar_token: {
                eq: aadhaar_token,
              },
            },
          });
          const url = process.env.REGISTRY_URL + 'api/v1/Learner/search';
          const config: AxiosRequestConfig = {
            headers: {
              'Content-Type': 'application/json',
            },
          };
          let response_data = null;
          try {
            const observable = this.httpService.post(url, data, config);
            const promise = observable.toPromise();
            const response = await promise;
            response_data = response.data;
          } catch (e) {
            response_data = { error: e };
          }
          done(response_data);
        });
        response_array[i].sbrc_search = search_response;
        if (search_response[0]?.osid) {
          //get search osid and keycloak username
          let os_id = search_response[0].osid;
          let keycloak_user = search_response[0].username;
          console.log('os_id', os_id);
          console.log('keycloak_user', keycloak_user);
          if (keycloak_user != '') {
            console.log('deleting keycloak user ' + keycloak_user);
            try {
              //delete keycloak user
              //get client token
              let client_token = token;
              //console.log('client_token', client_token);
              //get user id
              let search_keycloak_user = await new Promise<any>(
                async (done) => {
                  const url =
                    process.env.KEYCLOAK_URL +
                    'admin/realms/sunbird-rc/users?username=' +
                    keycloak_user;
                  const config: AxiosRequestConfig = {
                    headers: {
                      'Content-Type': 'application/json',
                      Authorization: 'Bearer ' + client_token,
                    },
                  };
                  let response_data = null;
                  try {
                    const observable = this.httpService.get(url, config);
                    const promise = observable.toPromise();
                    const response = await promise;
                    response_data = response.data;
                  } catch (e) {
                    response_data = { error: e };
                  }
                  done(response_data);
                },
              );
              response_array[i].search_keycloak_user = search_keycloak_user;
              /*console.log(
            'search_keycloak_user',
            JSON.stringify(search_keycloak_user),
          );*/
              if (search_keycloak_user[0].id) {
                let user_id = search_keycloak_user[0].id;
                console.log('user_id', user_id);
                //delete user
                let search_keycloak_user_delete = await new Promise<any>(
                  async (done) => {
                    const url =
                      process.env.KEYCLOAK_URL +
                      'admin/realms/sunbird-rc/users/' +
                      user_id;
                    const config: AxiosRequestConfig = {
                      headers: {
                        'Content-Type': 'application/json',
                        Authorization: 'Bearer ' + client_token,
                      },
                    };
                    let response_data = null;
                    try {
                      const observable = this.httpService.delete(url, config);
                      const promise = observable.toPromise();
                      const response = await promise;
                      response_data = response.data;
                    } catch (e) {
                      response_data = { error: e };
                    }
                    done(response_data);
                  },
                );
                response_array[i].search_keycloak_user_delete =
                  search_keycloak_user_delete;
                /*console.log(
            'search_keycloak_user_delete',
            JSON.stringify(search_keycloak_user_delete),
          );*/
              }
            } catch (e) {
              response_array[i].keycloakerror = e;
              console.log(
                'errorn in keycloak delete user. user not found in keycloak',
              );
            }
          }
          try {
            //delete user from sunbird rc
            let search_sbrc_user_delete = await new Promise<any>(
              async (done) => {
                const url =
                  process.env.REGISTRY_URL + 'api/v1/Learner/' + os_id;
                const config: AxiosRequestConfig = {
                  headers: {},
                };
                let response_data = null;
                try {
                  const observable = this.httpService.delete(url, config);
                  const promise = observable.toPromise();
                  const response = await promise;
                  response_data = response.data;
                } catch (e) {
                  response_data = { error: e };
                }
                done(response_data);
              },
            );
            response_array[i].search_sbrc_user_delete = search_sbrc_user_delete;
            console.log(
              'search_sbrc_user_delete',
              JSON.stringify(search_sbrc_user_delete),
            );
          } catch (e) {
            response_array[i].sbrcerror = e;
            console.log('errorn in sbrc delete user ', e);
          }
        }
      } catch (e) {
        response_array[i].scripterror = e;
        console.log('errorn in script ', e);
      }
    }
    return response.status(200).send({
      success: true,
      status: 'sbrc_account_delete_success',
      message: 'SBRC Account Delete Success',
      result: response_array,
    });
  }
}
