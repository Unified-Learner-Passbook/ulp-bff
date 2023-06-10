import { Injectable, StreamableFile } from '@nestjs/common';

import { HttpService } from '@nestjs/axios';
import { AxiosRequestConfig } from 'axios';

//custom imports
import { Response, Request } from 'express';
import * as wkhtmltopdf from 'wkhtmltopdf';
//sbrc api
import { KeycloakService } from '../services/keycloak/keycloak.service';
import { SbrcService } from '../services/sbrc/sbrc.service';
import { CredService } from 'src/services/cred/cred.service';
import { AadharService } from '../services/aadhar/aadhar.service';
import { count } from 'rxjs';

@Injectable()
export class PortalService {
  constructor(
    private readonly httpService: HttpService,
    private keycloakService: KeycloakService,
    private sbrcService: SbrcService,
    private credService: CredService,
    private aadharService: AadharService,
  ) {}
  //searchCount
  async searchCount(token: string, countFields: any, response: Response) {
    if (token && countFields.length > 0) {
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
        const sb_rc_search = await this.sbrcService.sbrcSearchEL('TeacherV1', {
          filters: {
            username: {
              eq: username?.preferred_username,
            },
          },
        });
        if (sb_rc_search?.error) {
          return response.status(501).send({
            success: false,
            status: 'sb_rc_search_error',
            message: 'Sunbird RC Teacher Search Failed',
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
          let schoolUdise = sb_rc_search[0]?.schoolUdise;
          //count field start
          let countlog = {};
          //common student list from udise code
          const sb_rc_search_student_udise_code =
            await this.sbrcService.sbrcSearchEL('StudentV2', {
              filters: {
                school_udise: {
                  eq: schoolUdise,
                },
              },
            });
          for (let i = 0; i < countFields.length; i++) {
            let field = countFields[i];
            let fieldcount = 0;
            //students_registered
            if (field === 'students_registered') {
              if (sb_rc_search_student_udise_code?.error) {
              } else {
                fieldcount = sb_rc_search_student_udise_code.length;
              }
            }
            //claims_pending
            if (field === 'claims_pending') {
              fieldcount = 0;
              for (let i = 0; i < sb_rc_search_student_udise_code.length; i++) {
                const sb_rc_search_student_detail =
                  await this.sbrcService.sbrcSearchEL('StudentDetailV2', {
                    filters: {
                      student_id: {
                        eq: sb_rc_search_student_udise_code[i].osid,
                      },
                      claim_status: {
                        eq: 'pending',
                      },
                    },
                  });
                if (sb_rc_search_student_detail?.error) {
                } else if (sb_rc_search_student_detail.length !== 0) {
                  fieldcount++;
                }
              }
            }
            //claims_approved
            if (field === 'claims_approved') {
              fieldcount = 0;
              for (let i = 0; i < sb_rc_search_student_udise_code.length; i++) {
                const sb_rc_search_student_detail =
                  await this.sbrcService.sbrcSearchEL('StudentDetailV2', {
                    filters: {
                      student_id: {
                        eq: sb_rc_search_student_udise_code[i].osid,
                      },
                      claim_status: {
                        eq: 'approved',
                      },
                    },
                  });
                if (sb_rc_search_student_detail?.error) {
                } else if (sb_rc_search_student_detail.length !== 0) {
                  fieldcount++;
                }
              }
            }
            //claims_rejected
            if (field === 'claims_rejected') {
              fieldcount = 0;
              for (let i = 0; i < sb_rc_search_student_udise_code.length; i++) {
                const sb_rc_search_student_detail =
                  await this.sbrcService.sbrcSearchEL('StudentDetailV2', {
                    filters: {
                      student_id: {
                        eq: sb_rc_search_student_udise_code[i].osid,
                      },
                      claim_status: {
                        eq: 'rejected',
                      },
                    },
                  });
                if (sb_rc_search_student_detail?.error) {
                } else if (sb_rc_search_student_detail.length !== 0) {
                  fieldcount++;
                }
              }
            }
            //credentials_issued
            if (field === 'credentials_issued') {
              //find school did from school udise id
              let did = '';
              //find if student account present in sb rc or not
              const sb_rc_search = await this.sbrcService.sbrcSearchEL(
                'SchoolDetail',
                {
                  filters: {
                    udiseCode: {
                      eq: schoolUdise,
                    },
                  },
                },
              );
              if (sb_rc_search?.error) {
              } else if (sb_rc_search.length === 0) {
                // no school found
              } else {
                //get did id
                did = sb_rc_search[0].did;
              }
              //get issues credentials list from school did
              var data = JSON.stringify({
                issuer: {
                  id: did,
                },
              });

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
              } else {
                //check only student count
                let fieldcount_student = 0;
                for (let i = 0; i < render_response.length; i++) {
                  if (render_response[i]?.credentialSubject?.student_name) {
                    fieldcount_student++;
                  }
                }
                fieldcount = fieldcount_student;
              }
            }
            countlog[field] = fieldcount;
          }
          return response.status(200).send({
            success: true,
            status: 'count_success',
            message: 'Count Success',
            result: countlog,
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
  //getAadhaar
  async getAadhaar(
    aadhaar_id: string,
    aadhaar_name: string,
    aadhaar_dob: string,
    aadhaar_gender: string,
    response: Response,
  ) {
    if (aadhaar_id && aadhaar_name && aadhaar_dob && aadhaar_gender) {
      const aadhar_data = await this.aadharService.aadhaarDemographic(
        aadhaar_id,
        aadhaar_name,
        aadhaar_dob,
        aadhaar_gender,
      );
      if (!aadhar_data?.success === true) {
        return response.status(400).send({
          success: false,
          status: 'aadhaar_api_error',
          message: 'Aadhar API Not Working',
          result: aadhar_data?.result,
        });
      } else {
        if (aadhar_data?.result?.ret === 'y') {
          const decodedxml = aadhar_data?.decodedxml;
          const uuid = await this.aadharService.getUUID(decodedxml);
          if (uuid === null) {
            return response.status(400).send({
              success: false,
              status: 'aadhaar_api_uuid_error',
              message: 'Aadhar API UUID Not Found',
              result: null,
            });
          } else {
            return response.status(200).send({
              success: true,
              status: 'aadhaar_verify_success',
              message: 'Aadhaar Verify Success',
              result: { uuid: uuid },
            });
          }
        } else {
          return response.status(200).send({
            success: false,
            status: 'invalid_aadhaar',
            message: 'Invalid Aadhaar',
            result: null,
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
  //credentials
  async credentials(token: string, did: string, response: Response) {
    if (token) {
      const tokenUsername = await this.keycloakService.verifyUserToken(token);
      if (tokenUsername?.error) {
        return response.status(401).send({
          success: false,
          status: 'keycloak_token_bad_request',
          message: 'You do not have access for this request.',
          result: null,
        });
      } else if (!tokenUsername?.preferred_username) {
        return response.status(401).send({
          success: false,
          status: 'keycloak_token_error',
          message: 'Your Login Session Expired.',
          result: null,
        });
      } else {
        let cred_search = await this.credService.credSearchDID(did);

        if (cred_search?.error) {
          return response.status(501).send({
            success: false,
            status: 'cred_search_error',
            message: 'Credentials Search Failed ! Please Try Again.',
            result: cred_search?.error,
          });
        } else if (cred_search.length === 0) {
          return response.status(404).send({
            success: false,
            status: 'cred_search_no_found',
            message: 'Credentials Not Found',
            result: null,
          });
        } else {
          return response.status(200).send({
            success: true,
            status: 'cred_success',
            message: 'Credentials Found',
            result: cred_search,
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

  //renderCredentials
  async renderCredentials(
    token: string,
    requestbody: any,
  ): Promise<string | StreamableFile> {
    if (token) {
      const tokenUsername = await this.keycloakService.verifyUserToken(token);
      if (tokenUsername?.error) {
        return 'Keycloak Student Token Expired';
      } else if (!tokenUsername?.preferred_username) {
        return 'Keycloak Student Token Expired';
      } else {
        var data = JSON.stringify(requestbody);

        const url = process.env.CRED_URL + '/credentials/render';

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
          //render_response = { error: e };
        }
        if (render_response == null) {
          return 'Credentials Render Failed ! Please Try Again.';
        } else {
          //return render_response;
          try {
            return new StreamableFile(
              await wkhtmltopdf(render_response, {
                pageSize: 'A4',
                disableExternalLinks: true,
                disableInternalLinks: true,
                disableJavascript: true,
              }),
            );
          } catch (e) {
            //console.log(e);
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
      const tokenUsername = await this.keycloakService.verifyUserToken(token);
      if (tokenUsername?.error) {
        return response.status(401).send({
          success: false,
          status: 'keycloak_token_bad_request',
          message: 'You do not have access for this request.',
          result: null,
        });
      } else if (!tokenUsername?.preferred_username) {
        return response.status(400).send({
          success: false,
          status: 'keycloak_token_error',
          message: 'Your Login Session Expired.',
          result: null,
        });
      } else {
        var data = JSON.stringify(requestbody);

        const url = process.env.CRED_URL + '/credentials/render';

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
          //render_response = { error: e };
        }

        if (render_response == null) {
          return response.status(400).send({
            success: false,
            status: 'render_api_failed',
            message: 'Credentials Render Failed ! Please Try Again.',
            result: null,
          });
        } else {
          return response.status(200).send({
            success: true,
            status: 'render_api_success',
            message: 'Cred Render API Success',
            result: render_response,
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

  //renderTemplate
  async renderTemplate(id: string, response: Response) {
    if (id) {
      const url = process.env.SCHEMA_URL + '/rendering-template?id=' + id;

      const config: AxiosRequestConfig = {
        headers: {},
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
          status: 'render_template_api_failed',
          message: 'Render Template Failed ! Please Try Again.',
          result: null,
        });
      } else {
        return response.status(200).send({
          success: true,
          status: 'render_template_api_success',
          message: 'Render Template API Success',
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

  //renderTemplateSchema
  async renderTemplateSchema(id: string, response: Response) {
    if (id) {
      const url = process.env.SCHEMA_URL + '/rendering-template/' + id;

      var config = {
        headers: {},
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

  //credentialsSearch
  async credentialsSearch(
    token: string,
    type: string,
    requestbody: any,
    response: Response,
  ) {
    if (token && requestbody) {
      const tokenUsername = await this.keycloakService.verifyUserToken(token);
      if (tokenUsername?.error) {
        return response.status(401).send({
          success: false,
          status: 'keycloak_token_bad_request',
          message: 'You do not have access for this request.',
          result: null,
        });
      } else if (!tokenUsername?.preferred_username) {
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
          let render_response_student = [];
          if (type === 'student') {
            for (let i = 0; i < render_response.length; i++) {
              if (render_response[i]?.credentialSubject?.student_name) {
                render_response_student.push(render_response[i]);
              }
            }
          } else if (type === 'teacher') {
            for (let i = 0; i < render_response.length; i++) {
              if (!render_response[i]?.credentialSubject?.student_name) {
                render_response_student.push(render_response[i]);
              }
            }
          } else {
            render_response_student = render_response;
          }
          return response.status(200).send({
            success: true,
            status: 'cred_search_api_success',
            message: 'Cred Search API Success',
            result: render_response_student,
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

  //credentialsIssue
  async credentialsIssue(token: string, requestbody: any, response: Response) {
    if (token && requestbody) {
      const tokenUsername = await this.keycloakService.verifyUserToken(token);
      if (tokenUsername?.error) {
        return response.status(401).send({
          success: false,
          status: 'keycloak_bad_request',
          message: 'You do not have access for this request.',
          result: null,
        });
      } else if (!tokenUsername?.preferred_username) {
        return response.status(400).send({
          success: false,
          status: 'keycloak_token_error',
          message: 'Your Login Session Expired.',
          result: null,
        });
      } else {
        var data = JSON.stringify(requestbody);
        const url = process.env.CRED_URL + '/credentials/issue';

        var config = {
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
            status: 'cred_issue_api_failed',
            message: 'Credentials Issue Failed ! Please Try Again.',
            result: render_response,
          });
        } else {
          return response.status(200).send({
            success: true,
            status: 'cred_issue_api_success',
            message: 'Cred Issue API Success',
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

  //credentialsSchema
  async credentialsSchema(id: string, response: Response) {
    if (id) {
      const url = process.env.CRED_URL + '/credentials/schema/' + id;

      var config = {
        headers: {},
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
        response_text = { error: error };
      }
      if (response_text?.error) {
        return response.status(400).send({
          success: false,
          status: 'cred_schema_api_failed',
          message: 'Credentials Schema Failed ! Please Try Again.',
          result: response_text,
        });
      } else {
        return response.status(200).send({
          success: true,
          status: 'cred_schema_api_success',
          message: 'Cred Schema API Success',
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
      const url = process.env.SCHEMA_URL + '/schema/jsonld?id=' + id;

      const config: AxiosRequestConfig = {
        headers: {},
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
        response_text = { error: error };
      }
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
}
