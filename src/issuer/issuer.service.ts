import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { AxiosRequestConfig } from 'axios';
import { Response } from 'express';
import { CredService } from 'src/services/cred/cred.service';
import { SbrcService } from 'src/services/sbrc/sbrc.service';
import { TelemetryService } from 'src/services/telemetry/telemetry.service';
import { AadharService } from 'src/services/aadhar/aadhar.service';
import { KeycloakService } from 'src/services/keycloak/keycloak.service';
import jwt_decode from 'jwt-decode';
//import { UsersService } from 'src/services/users/users.service';
const { Readable } = require('stream');

@Injectable()
export class IssuerService {
  constructor(
    private credService: CredService,
    private sbrcService: SbrcService,
    private telemetryService: TelemetryService,
    private aadharService: AadharService,
    private keycloakService: KeycloakService,
    private readonly httpService: HttpService, //private usersService: UsersService,
  ) {}

  fs = require('fs');
  async = require('async');

  //issuer
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
  //getDID
  async getDID(uniquetext: string, response: Response) {
    if (uniquetext) {
      const generateddid = await this.credService.generateDid(uniquetext);
      if (generateddid?.error) {
        return response.status(400).send({
          success: false,
          status: 'did_generate_error',
          message: 'Identity Generation Failed ! Please Try Again.',
          result: generateddid?.error,
        });
      } else {
        var did = generateddid[0].verificationMethod[0].controller;
        return response.status(200).send({
          success: true,
          status: 'did_success',
          message: 'DID Success',
          result: did,
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
  //getIssuerRegister
  async getIssuerRegister(
    token: string,
    name: string,
    did: string,
    username: string,
    password: string,
    response: Response,
  ) {
    if (token && name && did && username && password) {
      let jwt_decode = await this.parseJwt(token);
      let clientId = jwt_decode?.clientId ? jwt_decode.clientId : [];
      //check admin roles in jwt
      if (clientId === process.env.KEYCLOAK_CLIENT_ID) {
        // find student
        let searchSchema = {
          filters: {
            did: {
              eq: did,
            },
          },
        };
        const issuerDetails = await this.sbrcService.sbrcSearch(
          searchSchema,
          'Issuer',
        );
        console.log('Issuer Details', issuerDetails);
        if (issuerDetails.length == 0) {
          //register in keycloak and then in sunbird rc
          //create keycloak and then login
          const clientToken = await this.keycloakService.getClientToken();
          console.log('clientToken', clientToken);
          if (clientToken?.error) {
            return response.status(401).send({
              success: false,
              status: 'keycloak_client_token_error',
              message: 'System Authentication Failed ! Please Try Again.',
              result: null,
            });
          } else {
            ///register in keycloak
            let response_text = await this.keycloakService.registerUserKeycloak(
              username,
              password,
              clientToken,
            );
            console.log('registerUserKeycloak', response_text);
            if (response_text?.error) {
              return response.status(400).send({
                success: false,
                status: 'keycloak_register_duplicate',
                message:
                  'You entered username Account Already Present in Keycloak.',
                result: null,
              });
            } else {
              //register and create account in sunbird rc
              let inviteSchema = {
                name: name,
                did: did,
                username: username,
              };
              console.log('inviteSchema', inviteSchema);
              let createIssuer = await this.sbrcService.sbrcInvite(
                inviteSchema,
                'Issuer',
              );
              console.log('createIssuer', createIssuer);
              if (createIssuer) {
                return response.status(200).send({
                  success: true,
                  status: 'sbrc_register_success',
                  message: 'Issuer Account Registered. Complete Aadhar KYC.',
                  result: null,
                });
              } else {
                //need to add rollback function for keycloak user delete
                let response_text_keycloak =
                  await this.keycloakService.deleteUserKeycloak(
                    username,
                    clientToken,
                  );
                if (response_text_keycloak?.error) {
                  return response.status(400).send({
                    success: false,
                    status: 'sbrc_invite_error_delete_keycloak',
                    message: 'Unable to Register Issuer. Try Again.',
                    result: null,
                  });
                } else {
                  return response.status(400).send({
                    success: false,
                    status: 'sbrc_invite_error',
                    message: 'Unable to Register Issuer. Try Again.',
                    result: null,
                  });
                }
              }
            }
          }
        } else if (issuerDetails.length > 0) {
          if (issuerDetails[0].username != '') {
            return response.status(400).send({
              success: false,
              status: 'sbrc_register_duplicate',
              message: `You entered DID account details already linked to an existing Keycloak account, which has a username ${issuerDetails[0].username}. You cannot set a new username for this account detail. Login using the linked username and password.`,
              result: null,
            });
          } else {
            //register in keycloak and then update username
            //register in keycloak
            //create keycloak and then login
            const clientToken = await this.keycloakService.getClientToken();
            if (clientToken?.error) {
              return response.status(401).send({
                success: false,
                status: 'keycloak_client_token_error',
                message: 'System Authentication Failed ! Please Try Again.',
                result: null,
              });
            } else {
              ///register in keycloak
              let response_text =
                await this.keycloakService.registerUserKeycloak(
                  username,
                  password,
                  clientToken,
                );
              if (response_text?.error) {
                return response.status(400).send({
                  success: false,
                  status: 'keycloak_register_duplicate',
                  message:
                    'You entered username Account Already Present in Keycloak.',
                  result: null,
                });
              } else {
                //update username and register in keycloak
                //update username
                let updateRes = await this.sbrcService.sbrcUpdate(
                  { username: username },
                  'Issuer',
                  issuerDetails[0].osid,
                );
                if (updateRes) {
                  return response.status(200).send({
                    success: true,
                    status: 'sbrc_register_success',
                    message:
                      'Issuer Account Registered. Login using username and password.',
                    result: null,
                  });
                } else {
                  //need to add rollback function for keycloak user delete
                  let response_text_keycloak =
                    await this.keycloakService.deleteUserKeycloak(
                      username,
                      clientToken,
                    );
                  if (response_text_keycloak?.error) {
                    return response.status(400).send({
                      success: false,
                      status: 'sbrc_invite_error_delete_keycloak',
                      message: 'Unable to Register Issuer. Try Again.',
                      result: null,
                    });
                  } else {
                    return response.status(200).send({
                      success: false,
                      status: 'sbrc_update_error',
                      message:
                        'Unable to Update Issuer Username ! Please Try Again.',
                      result: null,
                    });
                  }
                }
              }
            }
          }
        } else {
          return response.status(200).send({
            success: false,
            status: 'sbrc_search_error',
            message: 'Unable to search Issuer. Try Again.',
            result: null,
          });
        }
      } else {
        return response.status(400).send({
          success: false,
          status: 'invalid_request',
          message: 'Invalid Keycloak Token',
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
  //getDetailIssuer
  async getDetailIssuer(token: string, response: Response) {
    if (token) {
      const studentUsername = await this.keycloakService.verifyUserToken(token);
      if (studentUsername?.error) {
        return response.status(401).send({
          success: false,
          status: 'keycloak_token_bad_request',
          message: 'You do not have access for this request.',
          result: null,
        });
      } else if (!studentUsername?.preferred_username) {
        return response.status(401).send({
          success: false,
          status: 'keycloak_token_error',
          message: 'Your Login Session Expired.',
          result: null,
        });
      } else {
        const sb_rc_search = await this.sbrcService.sbrcSearchEL('Issuer', {
          filters: {
            username: {
              eq: studentUsername?.preferred_username,
            },
          },
        });
        if (sb_rc_search?.error) {
          return response.status(501).send({
            success: false,
            status: 'sb_rc_search_error',
            message: 'System Search Error ! Please try again.',
            result: sb_rc_search?.error.message,
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
            status: 'sb_rc_search_found',
            message: 'Data Found in System.',
            result: sb_rc_search[0],
          });
        }
      }
    } else {
      return response.status(400).send({
        success: false,
        status: 'invalid_request',
        message: 'Invalid Request. Not received token.',
        result: null,
      });
    }
  }
  //getListIssuer
  async getListIssuer(response: Response) {
    const sb_rc_search = await this.sbrcService.sbrcSearchEL('Issuer', {
      filters: {},
    });
    if (sb_rc_search?.error) {
      return response.status(501).send({
        success: false,
        status: 'sb_rc_search_error',
        message: 'System Search Error ! Please try again.',
        result: sb_rc_search?.error.message,
      });
    } else if (sb_rc_search.length === 0) {
      return response.status(404).send({
        success: false,
        status: 'sb_rc_search_no_found',
        message: 'Data Not Found in System.',
        result: null,
      });
    } else {
      let issuer_detail = [];
      for (let i = 0; i < sb_rc_search.length; i++) {
        issuer_detail.push({
          name: sb_rc_search[i].name,
          did: sb_rc_search[i].did,
        });
      }
      return response.status(200).send({
        success: true,
        status: 'sb_rc_search_found',
        message: 'Data Found in System.',
        result: issuer_detail,
      });
    }
  }

  //helper function
  //get jwt token information
  parseJwt = async (token): Promise<any> => {
    if (!token) {
      return {};
    }
    const decoded = jwt_decode(token);
    return decoded;
  };
}
