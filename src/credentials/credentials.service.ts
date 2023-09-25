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
import { TelemetryService } from 'src/services/telemetry/telemetry.service';
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
const crypto = require('crypto');
const jQuery = require('jquery');
const cheerio = require('cheerio');

const minimize = require('minimize');
@Injectable()
export class CredentialsService {
  constructor(
    private readonly httpService: HttpService,
    private aadharService: AadharService,
    private credService: CredService,
    private sbrcService: SbrcService,
    private telemetryService: TelemetryService,
    private keycloakService: KeycloakService,
  ) {}

  //axios call
  md5 = require('md5');
  moment = require('moment');
  qs = require('qs');

  //credentialsReissue
  async credentialsReissue(
    token: string,
    credId: string,
    credentialSubject: any,
    response: Response,
  ) {
    if (token && credId && credentialSubject) {
      const keycloakUsername = await this.keycloakService.verifyUserToken(
        token,
      );
      if (keycloakUsername?.error) {
        return response.status(401).send({
          success: false,
          status: 'keycloak_token_bad_request',
          message: 'You do not have access for this request.',
          result: null,
        });
      } else if (!keycloakUsername?.preferred_username) {
        return response.status(400).send({
          success: false,
          status: 'keycloak_token_error',
          message: 'Your Login Session Expired.',
          result: null,
        });
      } else {
        //fetch cred detail required for issue
        const cred_revoke = await this.credService.credRevoke(credId);
        console.log('cred_revoke', cred_revoke);
        if (cred_revoke?.status === 'REVOKED') {
          //reissue cred
          //get issuer
          let issuer = cred_revoke?.issuer;
          let issuanceDate = cred_revoke?.issuanceDate;
          let expirationDate = cred_revoke?.expirationDate;
          let stduent_did = cred_revoke?.subject?.id;
          let credential_schema_id = cred_revoke?.credential_schema;
          credentialSubject.id = stduent_did;
          let payload = {
            issuerId: issuer,
            issuanceDate: issuanceDate,
            expirationDate: expirationDate,
            credentialSubject: credentialSubject,
            credSchema: {
              id: credential_schema_id,
              version: '1.0.0',
            },
          };
          const issueCredential = await this.credService.issueCredentialsEL(
            payload,
          );
          if (issueCredential?.error) {
            return response.status(400).send({
              success: false,
              status: 'issue_credentials_failed',
              message: 'Issue Credentials Failed.',
              result: null,
            });
          } else {
            return response.status(200).send({
              success: true,
              status: 'cred_reissue_success',
              message: 'Credential Reissue API Success !',
              result: issueCredential,
            });
          }
        } else {
          return response.status(400).send({
            success: false,
            status: 'cred_revoke_error',
            message: 'Credential Revoke API Failed ! Please Try Again.',
            result: null,
          });
        }
      }
    } else {
      return response.status(400).send({
        success: false,
        status: 'invalid_request',
        message: 'Invalid Request. Not received token or requestbody.',
        result: null,
      });
    }
  }

  //credentialsRevoke
  async credentialsRevoke(token: string, credId: string, response: Response) {
    if (token && credId) {
      const keycloakUsername = await this.keycloakService.verifyUserToken(
        token,
      );
      if (keycloakUsername?.error) {
        return response.status(401).send({
          success: false,
          status: 'keycloak_token_bad_request',
          message: 'You do not have access for this request.',
          result: null,
        });
      } else if (!keycloakUsername?.preferred_username) {
        return response.status(400).send({
          success: false,
          status: 'keycloak_token_error',
          message: 'Your Login Session Expired.',
          result: null,
        });
      } else {
        const cred_revoke = await this.credService.credRevoke(credId);
        console.log('cred_revoke', cred_revoke);
        if (cred_revoke?.status === 'REVOKED') {
          return response.status(200).send({
            success: true,
            status: 'cred_revoke_success',
            message: 'Credential Revoke API Success !',
            result: cred_revoke,
          });
        } else {
          return response.status(400).send({
            success: false,
            status: 'cred_revoke_error',
            message: 'Credential Revoke API Failed ! Please Try Again.',
            result: null,
          });
        }
      }
    } else {
      return response.status(400).send({
        success: false,
        status: 'invalid_request',
        message: 'Invalid Request. Not received token or requestbody.',
        result: null,
      });
    }
  }

  //credentialsSearch
  async credentialsSearch(token: string, requestbody: any, response: Response) {
    if (token && requestbody) {
      const studentUsername = await this.keycloakService.verifyUserToken(token);
      if (studentUsername?.error) {
        return response.status(401).send({
          success: false,
          status: 'keycloak_token_bad_request',
          message: 'You do not have access for this request.',
          result: null,
        });
      } else if (!studentUsername?.preferred_username) {
        return response.status(400).send({
          success: false,
          status: 'keycloak_token_error',
          message: 'Your Login Session Expired.',
          result: null,
        });
      } else {
        var data = JSON.stringify(requestbody);

        const url = process.env.CRED_URL + '/credentials/search';

        const config: AxiosRequestConfig = {
          headers: {
            'Content-Type': 'application/json',
          },
        };

        let render_response = null;
        try {
          const observable = this.httpService.post(url, data, config);
          const promise = observable.toPromise();
          const response = await promise;
          //console.log(JSON.stringify(response.data));
          render_response = response.data;
        } catch (e) {
          //console.log(e);
          render_response = { error: e };
        }

        if (render_response?.error) {
          return response.status(400).send({
            success: false,
            status: 'cred_search_api_failed',
            message: 'Credentials Search Failed ! Please Try Again.',
            result: render_response,
          });
        } else {
          for (let i = 0; i < render_response.length; i++) {
            //get cred status
            let response_text_verify = await this.credService.credVerify(
              render_response[i]?.id,
            );
            if (response_text_verify?.error) {
              return response.status(400).send({
                success: false,
                status: 'cred_verify_api_failed',
                message: 'Credentials Verify Failed ! Please Try Again.',
                result: response_text_verify,
              });
            } else {
              render_response[i].status = response_text_verify?.status;
              render_response[i].checks = response_text_verify?.checks;
            }
          }
          return response.status(200).send({
            success: true,
            status: 'cred_search_api_success',
            message: 'Cred Search API Success',
            result: render_response,
          });
        }
      }
    } else {
      return response.status(400).send({
        success: false,
        status: 'invalid_request',
        message: 'Invalid Request. Not received token or requestbody.',
        result: null,
      });
    }
  }

  //getCredentials
  async getCredentials(id: string, response: Response) {
    if (id) {
      let response_text = await this.credService.getCred(id);
      if (response_text?.error) {
        return response.status(400).send({
          success: false,
          status: 'cred_schema_api_failed',
          message: 'Credentials Schema Failed ! Please Try Again.',
          result: response_text,
        });
      } else {
        //get cred status
        let response_text_verify = await this.credService.credVerify(id);
        if (response_text_verify?.error) {
          return response.status(400).send({
            success: false,
            status: 'cred_verify_api_failed',
            message: 'Credentials Verify Failed ! Please Try Again.',
            result: response_text_verify,
          });
        } else {
          response_text.status = response_text_verify?.status;
          response_text.checks = response_text_verify?.checks;
          return response.status(200).send({
            success: true,
            status: 'cred_api_success',
            message: 'Cred API Success',
            result: response_text,
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

  //renderTemplateSchema
  async renderTemplateSchema(id: string, response: Response) {
    if (id) {
      const url = process.env.SCHEMA_URL + '/template/' + id;

      var config = {
        headers: { Accept: 'application/json' },
      };
      let response_text = null;

      try {
        const observable = this.httpService.get(url, config);
        const promise = observable.toPromise();
        const response = await promise;
        //console.log(JSON.stringify(response.data));
        response_text = response.data;
      } catch (error) {
        //console.log(e);
        //response_text = { error: error };
      }
      if (response_text == null) {
        return response.status(400).send({
          success: false,
          status: 'render_template_schema_api_failed',
          message: 'Render Template Schema Failed ! Please Try Again.',
          result: null,
        });
      } else {
        return response.status(200).send({
          success: true,
          status: 'render_template_schema_api_success',
          message: 'Render Template Schema API Success',
          result: response_text,
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

  //credentialsSchemaJSON
  async credentialsSchemaJSON(id: string, response: Response) {
    if (id) {
      let response_text = await this.credService.generateSchemaEL(id);
      if (response_text?.error) {
        return response.status(400).send({
          success: false,
          status: 'cred_schema_json_api_failed',
          message: 'Credentials Schema JSON Failed ! Please Try Again.',
          result: response_text,
        });
      } else {
        return response.status(200).send({
          success: true,
          status: 'cred_schema_json_api_success',
          message: 'Cred Schema JSON API Success',
          result: response_text,
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

  //renderCredentials
  async renderCredentials(
    token: string,
    requestbody: any,
  ): Promise<string | StreamableFile> {
    if (token) {
      const studentUsername = await this.keycloakService.verifyUserToken(token);
      if (studentUsername?.error) {
        return 'Keycloak Student Token Expired';
      } else if (!studentUsername?.preferred_username) {
        return 'Keycloak Student Token Expired';
      } else {
        let filetype = 'text/html';
        let credentialid = requestbody?.credentialid;
        let templateid = requestbody?.templateid;

        const url = process.env.CRED_URL + '/credentials/' + credentialid;

        //console.log('url', url);
        const config: AxiosRequestConfig = {
          headers: { Accept: filetype, templateid: templateid },
        };

        let render_response = null;

        let certificateId = requestbody?.credential?.id;

        try {
          const observable = this.httpService.get(url, config);
          const promise = observable.toPromise();
          const response = await promise;

          render_response = response.data;
        } catch (e) {
          console.log(e);
          //render_response = { error: e };
        }
        if (render_response == null) {
          return 'Credentials Render Failed ! Please Try Again.';
        } else {
          //return render_response;

          try {
            const url = process.env.VERIFICATION_URL + certificateId;

            let modifiedHtml = null;

            const modified = await new Promise((resolve, reject) => {
              qr.toDataURL(url, function (err, code) {
                if (err) {
                  resolve(null);
                  return;
                }

                if (code) {
                  const newHtml = code;

                  const root = parse(render_response);

                  // Find the img tag with id "qrcode"
                  const qrcodeImg = root.querySelector('#qrcode');

                  if (qrcodeImg) {
                    qrcodeImg.setAttribute('src', newHtml);
                    modifiedHtml = root.toString();

                    resolve(modifiedHtml);
                  } else {
                    resolve(null);
                  }
                } else {
                  resolve(null);
                }
              });
            });

            if (!modified) {
              return new StreamableFile(
                await wkhtmltopdf(render_response, {
                  pageSize: 'A4',
                  disableExternalLinks: true,
                  disableInternalLinks: true,
                  disableJavascript: true,
                }),
              );
            } else {
              return new StreamableFile(
                await wkhtmltopdf(modifiedHtml, {
                  pageSize: 'A4',
                  disableExternalLinks: true,
                  disableInternalLinks: true,
                  disableJavascript: true,
                }),
              );
            }
          } catch (e) {
            console.log(e);

            return 'HTML to PDF Convert Fail';
          }
        }
      }
    } else {
      return 'Student Token Not Received';
    }
  }

  //renderCredentialsHTML
  async renderCredentialsHTML(
    token: string,
    requestbody: any,
    response: Response,
  ) {
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
        return response.status(400).send({
          success: false,
          status: 'keycloak_token_error',
          message: 'Your Login Session Expired.',
          result: null,
        });
      } else {
        let filetype = 'text/html';
        let credentialid = requestbody?.credentialid;
        let templateid = requestbody?.templateid;

        const url = process.env.CRED_URL + '/credentials/' + credentialid;
        //console.log('url', url);
        const config: AxiosRequestConfig = {
          headers: { Accept: filetype, templateid: templateid },
        };

        let render_response = null;
        try {
          const observable = this.httpService.get(url, config);
          const promise = observable.toPromise();
          const response = await promise;
          //console.log(JSON.stringify(response.data));
          render_response = response.data;
        } catch (e) {
          //console.log(e);
          //render_response = { error: e };
        }

        if (render_response == null) {
          return response.status(400).send({
            success: false,
            status: 'render_api_failed',
            message: 'Credentials Render Failed ! Please Try Again.',
            result: render_response,
          });
        } else {
          //replace qr code
          try {
            const url = process.env.VERIFICATION_URL + credentialid;

            let modifiedHtml = null;

            const modified = await new Promise((resolve, reject) => {
              qr.toDataURL(url, function (err, code) {
                if (err) {
                  resolve(null);
                  return;
                }

                if (code) {
                  const newHtml = code;

                  const root = parse(render_response);

                  // Find the img tag with id "qrcode"
                  const qrcodeImg = root.querySelector('#qrcode');

                  if (qrcodeImg) {
                    qrcodeImg.setAttribute('src', newHtml);
                    modifiedHtml = root.toString();

                    resolve(modifiedHtml);
                  } else {
                    resolve(null);
                  }
                } else {
                  resolve(null);
                }
              });
            });
            if (!modified) {
              return response.status(200).send({
                success: true,
                status: 'render_api_success',
                message: 'Cred Render API Success',
                result: render_response,
              });
            } else {
              return response.status(200).send({
                success: true,
                status: 'render_api_success',
                message: 'Cred Render API Success',
                result: modifiedHtml,
              });
            }
          } catch (e) {
            console.log(e);
            return response.status(400).send({
              success: false,
              status: 'render_qr_code_api_failed',
              message:
                'Credentials Render Failed in QR code replace ! Please Try Again.',
              result: null,
            });
          }
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

  //credentialsVerify
  async credentialsVerify(id: string, response: Response) {
    if (id) {
      let response_text = await this.credService.credVerify(id);
      if (response_text?.error) {
        return response.status(400).send({
          success: false,
          status: 'cred_verify_api_failed',
          message: 'Credentials Verify Failed ! Please Try Again.',
          result: response_text,
        });
      } else {
        return response.status(200).send({
          success: true,
          status: 'cred_verify_api_success',
          message: 'Cred Verify API Success',
          result: response_text,
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

  async generateQRCode(certificateId) {
    const url = process.env.VERIFICATION_URL + certificateId;
    //converted into string
    // let qrcodestring = "";

    let stringData = JSON.stringify(url);

    let qrcodestring = await qr.toDataURL(stringData, function (err, code) {
      if (code) {
        qrcodestring = code;
        console.log(qrcodestring);

        return qrcodestring;
      } else {
        return err;
      }
    });
  }
}
