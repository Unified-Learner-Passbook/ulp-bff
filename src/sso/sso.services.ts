import { Injectable, StreamableFile } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { AxiosRequestConfig } from 'axios';

//custom imports
import jwt_decode from 'jwt-decode';
import { createWriteStream, writeFile } from 'fs';
import { Response, Request } from 'express';
import * as wkhtmltopdf from 'wkhtmltopdf';
import { UserDto } from './dto/user-dto';
import { schoolList } from './constlist/schoollist';
import { AadharService } from '../services/aadhar/aadhar.service';
import { SbrcService } from 'src/services/sbrc/sbrc.service';
import { CredService } from 'src/services/cred/cred.service';
import { KeycloakService } from 'src/services/keycloak/keycloak.service';
const crypto = require('crypto');

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
  //registerStudent
  async registerStudent(user: UserDto, response: Response) {
    if (user) {
      const clientToken = await this.keycloakService.getClientToken();
      if (clientToken?.error) {
        return response.status(401).send({
          success: false,
          status: 'keycloak_client_token_error',
          message: 'System Authentication Failed ! Please Try Again.',
          result: null,
        });
      } else {
        const issuerRes = await this.credService.generateDid(user.studentId);
        if (issuerRes?.error) {
          return response.status(400).send({
            success: false,
            status: 'did_generate_error',
            message: 'Identity Generation Failed ! Please Try Again.',
            result: issuerRes?.error,
          });
        } else {
          var did = issuerRes[0].verificationMethod[0].controller;

          //register student keycloak
          let response_text =
            await this.keycloakService.registerStudentKeycloak(
              user,
              clientToken,
            );
          //comment
          if (response_text?.error && false) {
            return response.status(400).send({
              success: false,
              status: 'keycloak_register_duplicate',
              message: 'Duplicate User.',
              result: null,
            });
          } else {
            // sunbird registery
            let sb_rc_response_text = await this.sbrcService.sbrcInviteEL(
              {
                did: did,
                aadhaarID: user.aadhaarId,
                studentName: user.studentName,
                schoolName: user.schoolName,
                schoolID: user.schoolId,
                studentSchoolID: user.studentId,
                phoneNo: user.phoneNo,
              },
              'StudentDetail',
            );

            if (sb_rc_response_text?.error) {
              return response.status(400).send({
                success: false,
                status: 'sb_rc_register_error',
                message: 'System Register Error ! Please try again.',
                result: sb_rc_response_text?.error,
              });
            } else if (sb_rc_response_text?.params?.status === 'SUCCESSFUL') {
              return response.status(201).send({
                success: true,
                status: 'registered',
                message: 'Student Registered Successfully.',
                result: sb_rc_response_text,
              });
            } else {
              return response.status(400).send({
                success: false,
                status: 'sb_rc_register_duplicate',
                message: 'Duplicate Data Found.',
                result: sb_rc_response_text,
              });
            }
          }
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

  //loginStudent
  async loginStudent(username: string, password: string, response: Response) {
    if (username && password) {
      const studentToken = await this.keycloakService.getKeycloakToken(
        username,
        password,
      );
      if (studentToken?.error) {
        return response.status(501).send({
          success: false,
          status: 'keycloak_invalid_credentials',
          message: studentToken?.error.message,
          result: null,
        });
      } else {
        const sb_rc_search = await this.sbrcService.sbrcSearchEL(
          'StudentDetail',
          {
            filters: {
              studentSchoolID: {
                eq: username,
              },
            },
          },
        );
        if (sb_rc_search?.error) {
          return response.status(501).send({
            success: false,
            status: 'sb_rc_search_error',
            message: 'System Search Error ! Please try again.',
            result: sb_rc_search?.error,
          });
        } else if (sb_rc_search.length !== 1) {
          return response.status(404).send({
            success: false,
            status: 'sb_rc_search_no_found',
            message: 'Data Not Found in System.',
            result: null,
          });
        } else {
          return response.status(200).send({
            success: true,
            status: 'login_success',
            message: 'Login Success',
            result: {
              userData: sb_rc_search,
              token: studentToken?.access_token,
            },
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

  //getDIDStudent
  async getDIDStudent(studentid: string, response: Response) {
    if (studentid) {
      const sb_rc_search = await this.sbrcService.sbrcSearchEL(
        'StudentDetail',
        {
          filters: {
            studentSchoolID: {
              eq: studentid,
            },
          },
        },
      );
      if (sb_rc_search?.error) {
        return response.status(501).send({
          success: false,
          status: 'sb_rc_search_error',
          message: 'System Search Error ! Please try again.',
          result: null,
        });
      } else if (sb_rc_search.length !== 1) {
        return response.status(404).send({
          success: false,
          status: 'sb_rc_search_no_found',
          message: 'Data Not Found in System.',
          result: null,
        });
      } else {
        return response.status(200).send({
          success: true,
          status: 'did_success',
          message: 'Identity Found.',
          result: sb_rc_search[0]?.did ? sb_rc_search[0].did : '',
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

  //credentialsStudent
  async credentialsStudent(token: string, response: Response) {
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
        const sb_rc_search = await this.sbrcService.sbrcSearchEL(
          'StudentDetail',
          {
            filters: {
              studentSchoolID: {
                eq: studentUsername?.preferred_username,
              },
            },
          },
        );
        if (sb_rc_search?.error) {
          return response.status(501).send({
            success: false,
            status: 'sb_rc_search_error',
            message: 'System Search Error ! Please try again.',
            result: sb_rc_search?.error.message,
          });
        } else if (sb_rc_search.length !== 1) {
          return response.status(404).send({
            success: false,
            status: 'sb_rc_search_no_found',
            message: 'Data Not Found in System.',
            result: null,
          });
        } else {
          let cred_search = await this.credService.credSearch(sb_rc_search);

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
      const studentUsername = await this.keycloakService.verifyUserToken(token);
      if (studentUsername?.error) {
        return 'Keycloak Student Token Expired';
      } else if (!studentUsername?.preferred_username) {
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
      const studentUsername = await this.keycloakService.verifyUserToken(token);
      if (studentUsername?.error) {
        return response.status(401).send({
          success: false,
          status: 'keycloak_bad_request',
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

  //credentialsVerify
  async credentialsVerify(id: string, response: Response) {
    if (id) {
      const url = process.env.CRED_URL + '/credentials/' + id + '/verify';

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

  //userData
  async userData(token: string, digiacc: string, response: Response) {
    if (token && digiacc) {
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
        //get user detail
        //find if student account present in sb rc or not
        const sb_rc_search = await this.sbrcService.sbrcSearchEL(
          digiacc === 'ewallet' ? 'StudentV2' : 'TeacherV1',
          {
            filters: {
              username: {
                eq: studentUsername?.preferred_username,
              },
            },
          },
        );
        //console.log(sb_rc_search);
        if (sb_rc_search?.error) {
          return response.status(501).send({
            success: false,
            status: 'sb_rc_search_error',
            message: 'System Search Error ! Please try again.',
            result: sb_rc_search?.error,
          });
        } else if (sb_rc_search.length === 0) {
          // no student found then register
          return response.status(501).send({
            success: false,
            status: 'sb_rc_search_no_found',
            message: 'Data Not Found in System.',
            result: sb_rc_search?.error,
          });
        } else {
          //check if user is private or public
          if (sb_rc_search[0]?.school_type === 'private') {
            //find if student private detaile
            const filter = {
              filters: {
                student_id: {
                  eq: sb_rc_search[0].osid,
                },
              },
            };
            const sb_rc_search_detail = await this.sbrcService.sbrcSearchEL(
              'StudentDetailV2',
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
              // no student found then register
              return response.status(501).send({
                success: false,
                status: 'sb_rc_search_no_found',
                message: 'Data Not Found in System.',
                result: sb_rc_search_detail?.error,
              });
            } else {
              //sent user value
              return response.status(200).send({
                success: true,
                status: 'sb_rc_search_found',
                message: 'Data Found in System.',
                result: sb_rc_search[0],
                detail: sb_rc_search_detail[0],
              });
            }
          } else {
            //sent user value
            return response.status(200).send({
              success: true,
              status: 'sb_rc_search_found',
              message: 'Data Found in System.',
              result: sb_rc_search[0],
              detail: null,
            });
          }
        }
      }
    } else {
      return response.status(400).send({
        success: false,
        status: 'invalid_request',
        message: 'Invalid Request. Not received token or acc type.',
        result: null,
      });
    }
  }

  //schoolData
  async schoolData(token: string, udise: string, response: Response) {
    if (token && udise) {
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
        //get user detail
        //find if student account present in sb rc or not
        const sb_rc_search = await this.sbrcService.sbrcSearchEL(
          'SchoolDetail',
          {
            filters: {
              udiseCode: {
                eq: udise,
              },
            },
          },
        );
        if (sb_rc_search?.error) {
          return response.status(501).send({
            success: false,
            status: 'sb_rc_search_error',
            message: 'System Search Error ! Please try again.',
            result: sb_rc_search?.error,
          });
        } else if (sb_rc_search.length === 0) {
          // no student found then register
          return response.status(501).send({
            success: false,
            status: 'sb_rc_search_no_found',
            message: 'Data Not Found in System.',
            result: sb_rc_search?.error,
          });
        } else {
          //sent user value
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
        message: 'Invalid Request. Not received token or udise.',
        result: null,
      });
    }
  }

  //digilockerAuthorize
  async digilockerAuthorize(digiacc: string, response: Response) {
    //code challange

    //const codeVerifier = generateRandomString(32);
    // const codeVerifier = "a123456abca";
    // console.log("codeVerifier", codeVerifier)

    // function generateRandomString(length) {
    //   const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    //   let result = '';
    //   for (let i = 0; i < length; i++) {
    //     result += characters.charAt(Math.floor(Math.random() * characters.length));
    //   }
    //   return result;
    // }

    // async function sha256(str) {
    //   const hash = crypto.createHash('sha256');
    //   hash.update(str);
    //   return hash.digest('hex');
    // }

    // const codeChallenge = await sha256(codeVerifier)

    // console.log("codeChallenge", codeChallenge)
    //&code_challenge=${codeChallenge}&code_challenge_method=S256

    //console.log(request);
    let digi_client_id = '';
    let digi_url_call_back_uri = '';
    if (digiacc === 'ewallet') {
      digi_client_id = process.env.EWA_CLIENT_ID;
      digi_url_call_back_uri = process.env.EWA_CALL_BACK_URL;
    } else if (digiacc === 'portal') {
      digi_client_id = process.env.URP_CLIENT_ID;
      digi_url_call_back_uri = process.env.URP_CALL_BACK_URL;
    }
    response.status(200).send({
      digiauthurl: `https://digilocker.meripehchaan.gov.in/public/oauth2/1/authorize?client_id=${digi_client_id}&response_type=code&redirect_uri=${digi_url_call_back_uri}&state=${digiacc}`,
    });
  }

  //digilockerToken
  async digilockerToken(
    response: Response,
    digiacc: string,
    auth_code: string,
  ) {
    if (digiacc && auth_code) {
      let digi_client_id = '';
      let digi_client_secret = '';
      let digi_url_call_back_uri = '';
      if (digiacc === 'ewallet') {
        digi_client_id = process.env.EWA_CLIENT_ID;
        digi_client_secret = process.env.EWA_CLIENT_SECRET;
        digi_url_call_back_uri = process.env.EWA_CALL_BACK_URL;
      } else if (digiacc === 'portal') {
        digi_client_id = process.env.URP_CLIENT_ID;
        digi_client_secret = process.env.URP_CLIENT_SECRET;
        digi_url_call_back_uri = process.env.URP_CALL_BACK_URL;
      }
      //nesjs/axios
      var data = this.qs.stringify({
        code: auth_code,
        grant_type: 'authorization_code',
        client_id: digi_client_id,
        client_secret: digi_client_secret,
        redirect_uri: digi_url_call_back_uri,
        //code_verifier: "a123456abca"
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
        console.log('error 1029', e);
        response_digi = { error: null };
      }
      if (response_digi?.error) {
        return response.status(401).send({
          success: false,
          status: 'digilocker_token_bad_request',
          message: 'You do not have access to use Digilocker.',
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
              message: 'You do not have access to use Digilocker.',
              result: response_digi?.error,
            });
          } else {
            const dob = await this.convertDate(token_data[0]?.birthdate);
            const username_name = token_data[0]?.given_name.split(' ')[0];
            const username_dob = await this.replaceChar(dob, '/', '');
            /*let auto_username = username_name + '@' + username_dob;
            auto_username = auto_username.toLowerCase();*/
            let response_data = {
              meripehchanid: token_data[0]?.sub,
              name: token_data[0]?.given_name,
              mobile: token_data[0]?.phone_number,
              dob: dob,
              username: '',
              gender: token_data[0]?.gender
                ? token_data[0].gender
                : 'not found',
            };
            const sb_rc_search = await this.sbrcService.sbrcSearchEL(
              digiacc === 'ewallet' ? 'StudentV2' : 'TeacherV1',
              digiacc === 'ewallet'
                ? {
                    filters: {
                      meripehchan_id: {
                        eq: response_data?.meripehchanid.toString(),
                      },
                    },
                  }
                : {
                    filters: {
                      meripehchanLoginId: {
                        eq: response_data?.meripehchanid.toString(),
                      },
                    },
                  },
            );
            if (sb_rc_search?.error) {
              return response.status(501).send({
                success: false,
                status: 'sb_rc_search_error',
                message: 'System Search Error ! Please try again.',
                result: sb_rc_search?.error.message,
              });
            } else if (sb_rc_search.length === 0) {
              return response.status(200).send({
                success: true,
                status: 'digilocker_login_success',
                message: 'Digilocker Login Success',
                result: response_data,
                digi: response_digi?.data,
                user: 'NO_FOUND',
                needaadhaar: 'YES',
              });
            } else if (
              (!sb_rc_search[0]?.aadhar_token && digiacc === 'ewallet') ||
              (sb_rc_search[0]?.aadhar_token === '' && digiacc === 'ewallet') ||
              (!sb_rc_search[0]?.aadharId && digiacc === 'portal') ||
              (sb_rc_search[0]?.aadharId === '' && digiacc === 'portal')
            ) {
              return response.status(200).send({
                success: true,
                status: 'digilocker_login_success',
                message: 'Digilocker Login Success',
                result: response_data,
                digi: response_digi?.data,
                user: 'FOUND',
                needaadhaar: 'YES',
              });
            } else {
              let auto_username =
                digiacc === 'ewallet'
                  ? //response_data?.username
                    sb_rc_search[0]?.username
                  : //response_data?.meripehchanid + '_teacher'
                    sb_rc_search[0]?.username;
              auto_username = auto_username.toLowerCase();
              const auto_password = await this.md5(
                auto_username + 'MjQFlAJOQSlWIQJHOEDhod',
              );
              const userToken = await this.keycloakService.getKeycloakToken(
                auto_username,
                auto_password,
              );
              if (userToken?.error) {
                //sbrc present but no keycloak
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
                  //register in keycloak
                  //register student keycloak
                  let response_text =
                    await this.keycloakService.registerUserKeycloak(
                      auto_username,
                      auto_password,
                      clientToken,
                    );
                  if (response_text?.error && false) {
                    return response.status(400).send({
                      success: false,
                      status: 'keycloak_register_duplicate',
                      message: 'Duplicate User.',
                      result: null,
                    });
                  } else {
                    const userToken =
                      await this.keycloakService.getKeycloakToken(
                        auto_username,
                        auto_password,
                      );
                    if (userToken?.error) {
                      //console.log(userToken?.error);
                      return response.status(501).send({
                        success: false,
                        status: 'keycloak_invalid_credentials',
                        message: userToken?.error.message,
                        result: null,
                      });
                    } else {
                      if (sb_rc_search[0]?.school_type === 'private') {
                        //find if student private detaile
                        const filter = {
                          filters: {
                            student_id: {
                              eq: sb_rc_search[0].osid,
                            },
                          },
                        };
                        const sb_rc_search_detail =
                          await this.sbrcService.sbrcSearchEL(
                            'StudentDetailV2',
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
                          // no student found then register
                          return response.status(501).send({
                            success: false,
                            status: 'sb_rc_search_no_found',
                            message: 'Data Not Found in System.',
                            result: sb_rc_search_detail,
                          });
                        } else {
                          //sent user value
                          return response.status(200).send({
                            success: true,
                            status: 'digilocker_login_success',
                            message: 'Digilocker Login Success',
                            result: response_data,
                            digi: response_digi?.data,
                            user: 'FOUND',
                            userData: sb_rc_search,
                            detail: sb_rc_search_detail[0],
                            token: userToken?.access_token,
                          });
                        }
                      } else {
                        return response.status(200).send({
                          success: true,
                          status: 'digilocker_login_success',
                          message: 'Digilocker Login Success',
                          result: response_data,
                          digi: response_digi?.data,
                          user: 'FOUND',
                          userData: sb_rc_search,
                          detail: null,
                          token: userToken?.access_token,
                        });
                      }
                    }
                  }
                }
              } else {
                if (sb_rc_search[0]?.school_type === 'private') {
                  //find if student private detaile
                  const filter = {
                    filters: {
                      student_id: {
                        eq: sb_rc_search[0].osid,
                      },
                    },
                  };
                  const sb_rc_search_detail =
                    await this.sbrcService.sbrcSearchEL(
                      'StudentDetailV2',
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
                    // no student found then register
                    return response.status(501).send({
                      success: false,
                      status: 'sb_rc_search_no_found',
                      message: 'Data Not Found in System.',
                      result: sb_rc_search_detail,
                    });
                  } else {
                    //sent user value
                    return response.status(200).send({
                      success: true,
                      status: 'digilocker_login_success',
                      message: 'Digilocker Login Success',
                      result: response_data,
                      digi: response_digi?.data,
                      user: 'FOUND',
                      userData: sb_rc_search,
                      detail: sb_rc_search_detail[0],
                      token: userToken?.access_token,
                    });
                  }
                } else {
                  return response.status(200).send({
                    success: true,
                    status: 'digilocker_login_success',
                    message: 'Digilocker Login Success',
                    result: response_data,
                    digi: response_digi?.data,
                    user: 'FOUND',
                    userData: sb_rc_search,
                    detail: null,
                    token: userToken?.access_token,
                  });
                }
              }
            }
          }
        } else {
          return response.status(401).send({
            success: false,
            status: 'digilocker_token_bad_request',
            message: 'You do not have access to use Digilocker.',
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

  //digilockerAadhaar
  async digilockerAadhaar(
    response: Response,
    digiacc: string,
    aadhaar_id: string,
    aadhaar_name: string,
    aadhaar_dob: string,
    aadhaar_gender: string,
    digilocker_id: string,
  ) {
    if (
      digiacc &&
      aadhaar_id &&
      aadhaar_name &&
      aadhaar_dob &&
      aadhaar_gender &&
      digilocker_id
    ) {
      const aadhar_data = await this.aadharService.aadhaarDemographic(
        aadhaar_id,
        aadhaar_name,
        aadhaar_dob,
        aadhaar_gender,
      );

      //console.log(aadhar_data);
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
              result: uuid,
            });
          } else {
            //check uuid present in sbrc or not
            const sb_rc_search = await this.sbrcService.sbrcSearchEL(
              digiacc === 'ewallet' ? 'StudentV2' : 'TeacherV1',
              digiacc === 'ewallet'
                ? {
                    filters: {
                      aadhar_token: {
                        eq: uuid.toString(),
                      },
                    },
                  }
                : {
                    filters: {
                      aadharId: {
                        eq: uuid.toString(),
                      },
                    },
                  },
            );
            if (sb_rc_search?.error) {
              return response.status(501).send({
                success: false,
                status: 'sb_rc_search_error',
                message: 'System Search Error ! Please try again.',
                result: sb_rc_search?.error.message,
              });
            } else if (sb_rc_search.length === 0) {
              return response.status(200).send({
                success: true,
                status: 'aadhaar_verify_success',
                message: 'Aadhaar Verify Success',
                result: { uuid: uuid },
                user: 'NO_FOUND',
              });
            } else {
              //update meripehchan id in sb rc
              const osid = sb_rc_search[0]?.osid;
              // sunbird registery student
              let sb_rc_response_text = await this.sbrcService.sbrcUpdateEL(
                digiacc === 'ewallet'
                  ? {
                      meripehchan_id: digilocker_id,
                    }
                  : {
                      meripehchanLoginId: digilocker_id,
                    },
                digiacc === 'ewallet' ? 'StudentV2' : 'TeacherV1',
                osid,
              );
              if (sb_rc_response_text?.error) {
                return response.status(400).send({
                  success: false,
                  status: 'sb_rc_update_error',
                  message: 'System Update Error ! Please try again.',
                  result: sb_rc_response_text?.error,
                });
              } else if (sb_rc_response_text?.params?.status === 'SUCCESSFUL') {
                let auto_username = sb_rc_search[0]?.username;
                auto_username = auto_username.toLowerCase();
                const auto_password = await this.md5(
                  auto_username + 'MjQFlAJOQSlWIQJHOEDhod',
                );
                const userToken = await this.keycloakService.getKeycloakToken(
                  auto_username,
                  auto_password,
                );
                if (userToken?.error) {
                  //sbrc present but no keycloak
                  //create keycloak and then login
                  const clientToken =
                    await this.keycloakService.getClientToken();
                  if (clientToken?.error) {
                    return response.status(401).send({
                      success: false,
                      status: 'keycloak_client_token_error',
                      message:
                        'System Authentication Failed ! Please Try Again.',
                      result: null,
                    });
                  } else {
                    //register in keycloak
                    //register student keycloak
                    let response_text =
                      await this.keycloakService.registerUserKeycloak(
                        auto_username,
                        auto_password,
                        clientToken,
                      );
                    if (response_text?.error && false) {
                      return response.status(400).send({
                        success: false,
                        status: 'keycloak_register_duplicate',
                        message: 'Duplicate User.',
                        result: null,
                      });
                    } else {
                      const userToken =
                        await this.keycloakService.getKeycloakToken(
                          auto_username,
                          auto_password,
                        );
                      if (userToken?.error) {
                        //console.log(userToken?.error);
                        return response.status(501).send({
                          success: false,
                          status: 'keycloak_invalid_credentials',
                          message: userToken?.error.message,
                          result: null,
                        });
                      } else {
                        if (sb_rc_search[0]?.school_type === 'private') {
                          //find if student private detaile
                          const filter = {
                            filters: {
                              student_id: {
                                eq: sb_rc_search[0].osid,
                              },
                            },
                          };
                          const sb_rc_search_detail =
                            await this.sbrcService.sbrcSearchEL(
                              'StudentDetailV2',
                              filter,
                            );
                          //console.log(sb_rc_search_detail);
                          if (sb_rc_search_detail?.error) {
                            return response.status(501).send({
                              success: false,
                              status: 'sb_rc_search_error',
                              message:
                                'System Search Error ! Please try again.',
                              result: sb_rc_search_detail?.error,
                            });
                          } else if (sb_rc_search_detail.length === 0) {
                            // no student found then register
                            return response.status(501).send({
                              success: false,
                              status: 'sb_rc_search_no_found',
                              message: 'Data Not Found in System.',
                              result: sb_rc_search_detail?.error,
                            });
                          } else {
                            //sent user value
                            return response.status(200).send({
                              success: true,
                              status: 'digilocker_login_success',
                              message: 'Digilocker Login Success',
                              user: 'FOUND',
                              userData: sb_rc_search,
                              detail: sb_rc_search_detail[0],
                              token: userToken?.access_token,
                            });
                          }
                        } else {
                          return response.status(200).send({
                            success: true,
                            status: 'digilocker_login_success',
                            message: 'Digilocker Login Success',
                            user: 'FOUND',
                            userData: sb_rc_search,
                            detail: null,
                            token: userToken?.access_token,
                          });
                        }
                      }
                    }
                  }
                } else {
                  if (sb_rc_search[0]?.school_type === 'private') {
                    //find if student private detaile
                    const filter = {
                      filters: {
                        student_id: {
                          eq: sb_rc_search[0].osid,
                        },
                      },
                    };
                    const sb_rc_search_detail =
                      await this.sbrcService.sbrcSearchEL(
                        'StudentDetailV2',
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
                      // no student found then register
                      return response.status(501).send({
                        success: false,
                        status: 'sb_rc_search_no_found',
                        message: 'Data Not Found in System.',
                        result: sb_rc_search_detail?.error,
                      });
                    } else {
                      //sent user value
                      return response.status(200).send({
                        success: true,
                        status: 'digilocker_login_success',
                        message: 'Digilocker Login Success',
                        user: 'FOUND',
                        userData: sb_rc_search,
                        detail: sb_rc_search_detail[0],
                        token: userToken?.access_token,
                      });
                    }
                  } else {
                    return response.status(200).send({
                      success: true,
                      status: 'digilocker_login_success',
                      message: 'Digilocker Login Success',
                      user: 'FOUND',
                      userData: sb_rc_search,
                      detail: null,
                      token: userToken?.access_token,
                    });
                  }
                }
              } else {
                return response.status(400).send({
                  success: false,
                  status: 'sb_rc_update_error',
                  message: 'System Update Error ! Please try again.',
                  result: sb_rc_response_text,
                });
              }
            }
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

  //digilockerRegister
  async digilockerRegister(
    response: Response,
    digiacc: string,
    userdata: any,
    digimpid: string,
  ) {
    if (digiacc && userdata && digimpid) {
      const clientToken = await this.keycloakService.getClientToken();
      if (clientToken?.error) {
        return response.status(401).send({
          success: false,
          status: 'keycloak_client_token_error',
          message: 'System Authentication Failed ! Please Try Again.',
          result: null,
        });
      } else {
        //register in keycloak
        let auto_username =
          digiacc === 'ewallet'
            ? userdata?.student?.aadhar_token
            : digimpid + '_teacher';
        auto_username = auto_username.toLowerCase();
        const auto_password = await this.md5(
          auto_username + 'MjQFlAJOQSlWIQJHOEDhod',
        );
        //register student keycloak
        let response_text = await this.keycloakService.registerUserKeycloak(
          auto_username,
          auto_password,
          clientToken,
        );

        if (response_text?.error && false) {
          return response.status(400).send({
            success: false,
            status: 'keycloak_register_duplicate',
            message: 'Duplicate User.',
            result: null,
          });
        } else {
          //ewallet registration student
          if (digiacc === 'ewallet') {
            //find if student account present in sb rc or not
            const sb_rc_search = await this.sbrcService.sbrcSearchEL(
              'StudentV2',
              {
                filters: {
                  aadhar_token: {
                    eq: userdata?.student?.aadhar_token,
                  },
                },
              },
            );
            //console.log(sb_rc_search);
            if (sb_rc_search?.error) {
              return response.status(501).send({
                success: false,
                status: 'sb_rc_search_error',
                message: 'System Search Error ! Please try again.',
                result: sb_rc_search?.error,
              });
            } else if (sb_rc_search.length === 0) {
              // no student found then register
              // sunbird registery student
              userdata.student.reference_id =
                'ULP_' + userdata.student.student_id;
              userdata.student.school_type = 'private';
              userdata.student.aadhaar_status = 'verified';
              userdata.student.aadhaar_enc = '';
              let sb_rc_response_text = await this.sbrcService.sbrcInviteEL(
                userdata.student,
                'StudentV2',
              );
              if (sb_rc_response_text?.error) {
                return response.status(400).send({
                  success: false,
                  status: 'sb_rc_register_error',
                  message: 'System Register Error ! Please try again.',
                  result: sb_rc_response_text?.error,
                });
              } else if (sb_rc_response_text?.params?.status === 'SUCCESSFUL') {
                console.log('sb_rc_response_text', sb_rc_response_text);
                //find osid of student and add detail in student details
                // sunbird registery student detail
                userdata.studentdetail.student_id =
                  sb_rc_response_text?.result?.StudentV2?.osid;
                userdata.studentdetail.claim_status = 'pending';
                let sb_rc_response_text_detail =
                  await this.sbrcService.sbrcInviteEL(
                    userdata.studentdetail,
                    'StudentDetailV2',
                  );
                if (sb_rc_response_text_detail?.error) {
                  return response.status(400).send({
                    success: false,
                    status: 'sb_rc_register_error',
                    message: 'System Register Error ! Please try again.',
                    result: sb_rc_response_text_detail?.error,
                  });
                } else if (
                  sb_rc_response_text_detail?.params?.status === 'SUCCESSFUL'
                ) {
                } else {
                  return response.status(400).send({
                    success: false,
                    status: 'sb_rc_register_duplicate',
                    message: 'Duplicate Data Found.',
                    result: sb_rc_response_text_detail,
                  });
                }
              } else {
                return response.status(400).send({
                  success: false,
                  status: 'sb_rc_register_duplicate',
                  message: 'Duplicate Data Found.',
                  result: sb_rc_response_text,
                });
              }
            } else {
              //update value found id
              const osid = sb_rc_search[0]?.osid;
              userdata.student.DID = sb_rc_search[0]?.DID;
              // sunbird registery student
              let sb_rc_response_text = await this.sbrcService.sbrcUpdateEL(
                {
                  meripehchan_id: userdata?.student?.meripehchan_id,
                  aadhar_token: userdata?.student?.aadhar_token,
                  student_id: userdata?.student?.student_id,
                  username: userdata?.student?.username,
                  aadhaar_status: 'verified',
                  aadhaar_enc: '',
                  gender: userdata?.student?.gender,
                  school_udise: userdata?.student?.school_udise,
                  school_name: userdata?.student?.school_name,
                  stateCode: userdata?.student?.stateCode,
                  stateName: userdata?.student?.stateName,
                  districtCode: userdata?.student?.districtCode,
                  districtName: userdata?.student?.districtName,
                  blockCode: userdata?.student?.blockCode,
                  blockName: userdata?.student?.blockName,
                },
                'StudentV2',
                osid,
              );
              if (sb_rc_response_text?.error) {
                return response.status(400).send({
                  success: false,
                  status: 'sb_rc_update_error',
                  message: 'System Update Error ! Please try again.',
                  result: sb_rc_response_text?.error,
                });
              } else if (sb_rc_response_text?.params?.status === 'SUCCESSFUL') {
                //update detail in student detail
                //find if student private detaile
                const filter = {
                  filters: {
                    student_id: {
                      eq: osid,
                    },
                  },
                };
                const sb_rc_search_detail = await this.sbrcService.sbrcSearchEL(
                  'StudentDetailV2',
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
                  // no student found then register
                  userdata.studentdetail.student_id = osid;
                  userdata.studentdetail.claim_status = 'pending';
                  let sb_rc_response_text_detail =
                    await this.sbrcService.sbrcInviteEL(
                      userdata.studentdetail,
                      'StudentDetailV2',
                    );
                  if (sb_rc_response_text_detail?.error) {
                    return response.status(400).send({
                      success: false,
                      status: 'sb_rc_register_error',
                      message: 'System Register Error ! Please try again.',
                      result: sb_rc_response_text_detail?.error,
                    });
                  } else if (
                    sb_rc_response_text_detail?.params?.status === 'SUCCESSFUL'
                  ) {
                  } else {
                    return response.status(400).send({
                      success: false,
                      status: 'sb_rc_register_duplicate',
                      message: 'Duplicate Data Found.',
                      result: sb_rc_response_text_detail,
                    });
                  }
                } else {
                  //get student detail os id and update
                  //update value found id
                  const osid = sb_rc_search_detail[0]?.osid;
                  // sunbird registery student
                  let sb_rc_response_text = await this.sbrcService.sbrcUpdateEL(
                    {
                      acdemic_year: userdata?.studentdetail?.acdemic_year,
                      gaurdian_name: userdata?.studentdetail?.gaurdian_name,
                      mobile: userdata?.studentdetail?.mobile,
                      grade: userdata?.studentdetail?.grade,
                      enrollon: userdata?.studentdetail?.enrollon,
                    },
                    'StudentDetailV2',
                    osid,
                  );
                  if (sb_rc_response_text?.error) {
                    return response.status(400).send({
                      success: false,
                      status: 'sb_rc_update_error',
                      message: 'System Update Error ! Please try again.',
                      result: sb_rc_response_text?.error,
                    });
                  } else if (
                    sb_rc_response_text?.params?.status === 'SUCCESSFUL'
                  ) {
                  } else {
                    return response.status(400).send({
                      success: false,
                      status: 'sb_rc_update_error',
                      message: 'System Update Error ! Please try again.',
                      result: sb_rc_response_text,
                    });
                  }
                }
              } else {
                return response.status(400).send({
                  success: false,
                  status: 'sb_rc_update_error',
                  message: 'System Update Error ! Please try again.',
                  result: sb_rc_response_text,
                });
              }
            }
          }
          //portal registration teacher and school
          else {
            // sunbird registery teacher
            //find if teacher account present in sb rc or not
            const sb_rc_search = await this.sbrcService.sbrcSearchEL(
              'TeacherV1',
              {
                filters: {
                  meripehchanLoginId: {
                    eq: userdata?.teacher?.meripehchanLoginId,
                  },
                },
              },
            );
            if (sb_rc_search?.error) {
              return response.status(501).send({
                success: false,
                status: 'sb_rc_search_error',
                message: 'System Search Error ! Please try again.',
                result: sb_rc_search?.error,
              });
            } else if (sb_rc_search.length === 0) {
              //get teacher did
              const issuerRes = await this.credService.generateDid(
                userdata?.teacher?.meripehchanLoginId,
              );
              if (issuerRes?.error) {
                return response.status(400).send({
                  success: false,
                  status: 'did_generate_error',
                  message: 'Identity Generation Failed ! Please Try Again.',
                  result: issuerRes?.error,
                });
              } else {
                var did = issuerRes[0].verificationMethod[0].controller;
                userdata.teacher.did = did;
                userdata.teacher.username = auto_username;
                let sb_rc_response_text = await this.sbrcService.sbrcInviteEL(
                  userdata.teacher,
                  'TeacherV1',
                );
                if (sb_rc_response_text?.error) {
                  return response.status(400).send({
                    success: false,
                    status: 'sb_rc_register_error',
                    message: 'System Register Error ! Please try again.',
                    result: sb_rc_response_text?.error,
                  });
                } else if (
                  sb_rc_response_text?.params?.status === 'SUCCESSFUL'
                ) {
                  // sunbird registery school
                  //find if teacher account present in sb rc or not
                  const sb_rc_search_school =
                    await this.sbrcService.sbrcSearchEL('SchoolDetail', {
                      filters: {
                        udiseCode: {
                          eq: userdata?.school?.udiseCode,
                        },
                      },
                    });
                  if (sb_rc_search_school?.error) {
                    return response.status(501).send({
                      success: false,
                      status: 'sb_rc_search_error',
                      message: 'System Search Error ! Please try again.',
                      result: sb_rc_search_school?.error,
                    });
                  } else if (sb_rc_search_school.length === 0) {
                    //get school did
                    const issuerRes = await this.credService.generateDid(
                      userdata?.school?.udiseCode,
                    );
                    if (issuerRes?.error) {
                      return response.status(400).send({
                        success: false,
                        status: 'did_generate_error',
                        message:
                          'Identity Generation Failed ! Please Try Again.',
                        result: issuerRes?.error,
                      });
                    } else {
                      var did = issuerRes[0].verificationMethod[0].controller;
                      userdata.school.did = did;
                      let sb_rc_response_text =
                        await this.sbrcService.sbrcInviteEL(
                          userdata.school,
                          'SchoolDetail',
                        );
                      if (sb_rc_response_text?.error) {
                        return response.status(400).send({
                          success: false,
                          status: 'sb_rc_register_error',
                          message: 'System Register Error ! Please try again.',
                          result: sb_rc_response_text?.error,
                        });
                      } else if (
                        sb_rc_response_text?.params?.status === 'SUCCESSFUL'
                      ) {
                      } else {
                        return response.status(400).send({
                          success: false,
                          status: 'sb_rc_register_duplicate',
                          message: 'Duplicate Data Found.',
                          result: sb_rc_response_text,
                        });
                      }
                    }
                  } else {
                    //set school did
                    userdata.school.did = sb_rc_search_school[0].did;
                  }
                } else {
                  return response.status(400).send({
                    success: false,
                    status: 'sb_rc_register_duplicate',
                    message: 'Duplicate Data Found.',
                    result: sb_rc_response_text,
                  });
                }
              }
            } else {
              //set teacher did
              userdata.teacher.did = sb_rc_search[0].did;
              // sunbird registery school
              //find if teacher account present in sb rc or not
              const sb_rc_search_school = await this.sbrcService.sbrcSearchEL(
                'SchoolDetail',
                {
                  filters: {
                    udiseCode: {
                      eq: userdata?.school?.udiseCode,
                    },
                  },
                },
              );
              if (sb_rc_search_school?.error) {
                return response.status(501).send({
                  success: false,
                  status: 'sb_rc_search_error',
                  message: 'System Search Error ! Please try again.',
                  result: sb_rc_search_school?.error,
                });
              } else if (sb_rc_search_school.length === 0) {
                //get school did
                const issuerRes = await this.credService.generateDid(
                  userdata?.school?.udiseCode,
                );
                if (issuerRes?.error) {
                  return response.status(400).send({
                    success: false,
                    status: 'did_generate_error',
                    message: 'Identity Generation Failed ! Please Try Again.',
                    result: issuerRes?.error,
                  });
                } else {
                  var did = issuerRes[0].verificationMethod[0].controller;
                  userdata.school.did = did;
                  let sb_rc_response_text = await this.sbrcService.sbrcInviteEL(
                    userdata.school,
                    'SchoolDetail',
                  );
                  if (sb_rc_response_text?.error) {
                    return response.status(400).send({
                      success: false,
                      status: 'sb_rc_register_error',
                      message: 'System Register Error ! Please try again.',
                      result: sb_rc_response_text?.error,
                    });
                  } else if (
                    sb_rc_response_text?.params?.status === 'SUCCESSFUL'
                  ) {
                  } else {
                    return response.status(400).send({
                      success: false,
                      status: 'sb_rc_register_duplicate',
                      message: 'Duplicate Data Found.',
                      result: sb_rc_response_text,
                    });
                  }
                }
              } else {
                //set school did
                userdata.school.did = sb_rc_search_school[0].did;
              }
            }
          }
          //login and get token
          const userToken = await this.keycloakService.getKeycloakToken(
            auto_username,
            auto_password,
          );
          if (userToken?.error) {
            return response.status(501).send({
              success: false,
              status: 'keycloak_invalid_credentials',
              message: userToken?.error, //.message,
              result: null,
            });
          } else {
            return response.status(200).send({
              success: true,
              status: 'digilocker_login_success',
              message: 'Digilocker Login Success',
              user: 'FOUND',
              userData: userdata,
              token: userToken?.access_token,
            });
          }
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

  //digilockerLogout
  async digilockerLogout(
    response: Response,
    digiacc: string,
    access_token: string,
  ) {
    if (digiacc && access_token) {
      let digi_client_id = '';
      let digi_client_secret = '';
      let digi_url_call_back_uri = '';
      if (digiacc === 'ewallet') {
        digi_client_id = process.env.EWA_CLIENT_ID;
        digi_client_secret = process.env.EWA_CLIENT_SECRET;
        digi_url_call_back_uri = process.env.EWA_CALL_BACK_URL;
      } else if (digiacc === 'portal') {
        digi_client_id = process.env.URP_CLIENT_ID;
        digi_client_secret = process.env.URP_CLIENT_SECRET;
        digi_url_call_back_uri = process.env.URP_CALL_BACK_URL;
      }
      var data = this.qs.stringify({
        token: access_token,
        token_type_hint: 'access_token',
        client_id: digi_client_id,
        client_secret: digi_client_secret,
      });

      const url =
        'https://digilocker.meripehchaan.gov.in/public/oauth2/1/revoke';

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
      if (response_digi?.data?.revoked === true) {
        return response.status(200).send({
          success: true,
          status: 'digilocker_logout_success',
          message: 'Digilocker Logout Success',
          result: null,
        });
      } else {
        return response.status(200).send({
          success: false,
          status: 'digilocker_logout_error',
          message: 'Digilocker Logout Error',
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

  async getStudentDetail(requestbody, response: Response) {
    console.log('456');
    let studentDetails = await this.sbrcService.sbrcSearch(
      requestbody,
      'StudentDetail',
    );
    console.log('studentDetails', studentDetails);
    if (studentDetails) {
      return response.status(200).send({
        success: true,
        status: 'sb_rc_search_success',
        message: 'System Search Success',
        result: studentDetails,
      });
    } else {
      return response.status(200).send({
        success: false,
        status: 'sb_rc_search_error',
        message: 'System Search Error ! Please try again.',
        result: null,
      });
    }
  }

  async getStudentDetailV2(token: string, requestbody, response: Response) {
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
        const sb_rc_search = await this.sbrcService.sbrcSearchEL('TeacherV1', {
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
          const sb_rc_search_student = await this.sbrcService.sbrcSearchEL(
            'StudentV2',
            {
              filters: {
                school_udise: {
                  eq: schoolUdise,
                },
              },
            },
          );
          if (sb_rc_search_student?.error) {
            return response.status(501).send({
              success: false,
              status: 'sb_rc_search_error',
              message: 'System Search Error ! Please try again.',
              result: sb_rc_search_student?.error,
            });
          } else if (sb_rc_search_student.length === 0) {
            return response.status(200).send({
              success: true,
              status: 'sb_rc_search_no_found',
              message: 'Data Not Found in System.',
              result: [],
            });
          } else {
            let student_list = [];
            for (let i = 0; i < sb_rc_search_student.length; i++) {
              const sb_rc_search_student_detail =
                await this.sbrcService.sbrcSearchEL('StudentDetailV2', {
                  filters: {
                    student_id: {
                      eq: sb_rc_search_student[i].osid,
                    },
                    claim_status: {
                      eq: requestbody.filters.claim_status.eq,
                    },
                  },
                });
              if (sb_rc_search_student_detail?.error) {
              } else if (sb_rc_search_student_detail.length !== 0) {
                student_list.push({
                  student: sb_rc_search_student[i],
                  studentdetail: sb_rc_search_student_detail[0],
                });
              }
            }
            return response.status(200).send({
              success: true,
              status: 'sb_rc_search_found',
              message: 'Data Found in System.',
              result: student_list,
            });
          }
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
    // var studentDetails = await this.studentDetailsV2(requestbody);
    /*var studentDetails = await this.sbrcService.sbrcSearch(
      requestbody,
      'StudentDetailV2',
    );
    console.log('studentDetails', studentDetails.length);
    console.log('studentDetails1', studentDetails[1]);

    let promises = [];
    for (const iterator of studentDetails) {
      let searchSchema = {
        filters: {
          osid: {
            eq: iterator.student_id,
          },
        },
      };
      //promises.push(this.studentV2(searchSchema))
      promises.push(this.sbrcService.sbrcSearch(searchSchema, 'StudentV2'));
    }
    console.log('promises', promises.length);

    var students = await Promise.all(promises);

    let studentList = [];

    for (const item of students) {
      console.log('item', item);
      for (const iterator of item) {
        studentList.push(iterator);
      }
    }

    let completeStudentDetails = studentDetails.map((element) => {
      let temp = studentList.find((item) => item.osid === element.student_id);
      // console.log('temp', temp);
      element.student = temp ? temp : {};
      return element;
    });

    console.log('completeStudentDetails', completeStudentDetails.length);

    if (completeStudentDetails.length === studentDetails.length) {
      return response.status(200).send({
        success: true,
        status: 'sb_rc_search_success',
        message: 'System Search Success',
        result: completeStudentDetails,
      });
    } else {
      return response.status(200).send({
        success: false,
        status: 'sb_rc_search_error',
        message: 'System Search Error ! Please try again.',
        result: null,
      });
    }*/
  }
  //digilockerAuthorize
  async udiseVerify(udiseid: string, response: Response) {
    //console.log(request);
    response.status(200).send({
      udiseCode: udiseid,
      schoolName: 'SWAMI DYALANANDA J.B SCHOOL ' + udiseid,
      schoolCategory: 1,
      schoolManagementCenter: 1,
      schoolManagementState: 11,
      schoolType: 3,
      classFrom: 1,
      classTo: 5,
      stateCode: '16',
      stateName: 'Tripura',
      districtName: 'WEST TRIPURA',
      blockName: 'AGARTALA MUNICIPAL COORPORATION',
      locationType: 2,
      headOfSchoolMobile: '89******42',
      respondentMobile: '88******96',
      alternateMobile: '',
      schoolEmail: '',
    });
  }

  //getSchoolList
  async getSchoolList(response: Response) {
    //console.log('hi');
    response.status(200).send(schoolList);
  }
  //getSchoolListUdise
  async getSchoolListUdise(udise, password, response: Response) {
    //console.log('hi');
    if (password === '1234') {
      let obj = schoolList.find((o) => o.udiseCode === udise);
      if (obj) {
        response
          .status(200)
          .send({ success: true, status: 'found', data: obj });
      } else {
        response.status(400).send({ success: false, status: 'no_found' });
      }
    } else {
      response.status(200).send({ success: false, status: 'wrong_password' });
    }
  }

  //studentBulkRegister
  async studentBulkRegister(
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
        //get common detail
        let grade = requestbody?.schoolDetails?.grade;
        let school_udise = requestbody?.schoolDetails?.schoolUdise;
        let school_name = requestbody?.schoolDetails?.schoolName;
        let acdemic_year = requestbody?.schoolDetails?.['academic-year'];
        let school_type = requestbody?.schoolDetails?.school_type;
        //new schema field
        let stateCode = requestbody?.schoolDetails?.stateCode;
        let stateName = requestbody?.schoolDetails?.stateName;
        let districtCode = requestbody?.schoolDetails?.districtCode;
        let districtName = requestbody?.schoolDetails?.districtName;
        let blockCode = requestbody?.schoolDetails?.blockCode;
        let blockName = requestbody?.schoolDetails?.blockName;
        const studentDetails = requestbody?.studentDetails;
        let iserror = false;
        let loglist = [];
        let error_count = 0;
        let success_count = 0;
        let duplicate_count = 0;
        if (studentDetails) {
          for (let i = 0; i < studentDetails.length; i++) {
            loglist[i] = {};
            loglist[i].studentDetails = studentDetails[i];
            try {
              const student = studentDetails[i];
              //check student account present in system or not
              const username_name = student?.studentName.split(' ')[0];
              const username_dob = await this.replaceChar(
                student?.dob,
                '/',
                '',
              );
              let auto_username = username_name + '@' + username_dob;
              auto_username = auto_username.toLowerCase();
              const aadhaar_enc_text = await this.aadharService.encryptaadhaar(
                student?.aadhar_token,
              );
              //find if student account present in sb rc or not
              const sb_rc_search = await this.sbrcService.sbrcSearchEL(
                'StudentV2',
                {
                  filters: {
                    aadhar_token: {
                      eq: aadhaar_enc_text,
                    },
                  },
                },
              );
              //console.log(sb_rc_search);
              if (sb_rc_search?.error) {
                iserror = true;
                loglist[i].status = false;
                loglist[i].error = 'System Error ! Please try again.';
                loglist[i].errorlog = sb_rc_search?.error;
                error_count++;
              } else if (sb_rc_search.length === 0) {
                //register student in sb rc
                // sunbird registery student
                const issuerRes = await this.credService.generateDid(
                  student?.student_id,
                );
                if (issuerRes?.error) {
                  iserror = true;
                  loglist[i].status = false;
                  loglist[i].error =
                    'Student Identity Generation Failed ! Please Try Again.';
                  loglist[i].errorlog = issuerRes?.error;
                  error_count++;
                } else {
                  var didGenerate =
                    issuerRes[0].verificationMethod[0].controller;
                  let reference_id = 'ULP_' + student?.student_id;
                  let sb_rc_response_text = await this.sbrcService.sbrcInviteEL(
                    {
                      student_id: student?.student_id,
                      DID: didGenerate,
                      reference_id: reference_id,
                      aadhar_token: '',
                      student_name: student?.studentName,
                      dob: student?.dob,
                      school_type: school_type,
                      meripehchan_id: '',
                      username: auto_username,
                      aadhaar_status: '',
                      aadhaar_enc: aadhaar_enc_text,
                      gender: student?.gender,
                      school_udise: school_udise,
                      school_name: school_name,
                      stateCode: stateCode,
                      stateName: stateName,
                      districtCode: districtCode,
                      districtName: districtName,
                      blockCode: blockCode,
                      blockName: blockName,
                    },
                    'StudentV2',
                  );
                  if (sb_rc_response_text?.error) {
                    iserror = true;
                    loglist[i].status = false;
                    loglist[i].error =
                      'Student Register Failed ! Please Try Again.';
                    loglist[i].errorlog = sb_rc_response_text?.error;
                    error_count++;
                  } else if (
                    sb_rc_response_text?.params?.status === 'SUCCESSFUL'
                  ) {
                    //find osid of student and add detail in student details
                    // sunbird registery student detail
                    let os_student_id =
                      sb_rc_response_text?.result?.StudentV2?.osid;
                    let claim_status = 'approved';
                    let sb_rc_response_text_detail =
                      await this.sbrcService.sbrcInviteEL(
                        {
                          student_detail_id: '',
                          student_id: os_student_id,
                          mobile: student?.mobile,
                          gaurdian_name: student?.gaurdian_name,
                          grade: grade,
                          acdemic_year: acdemic_year,
                          start_date: '',
                          end_date: '',
                          claim_status: claim_status,
                          enrollon: student?.enrollon,
                        },
                        'StudentDetailV2',
                      );
                    if (sb_rc_response_text_detail?.error) {
                      iserror = true;
                      loglist[i].status = false;
                      loglist[i].error =
                        'Student Detail Register Failed ! Please Try Again.';
                      loglist[i].errorlog = sb_rc_response_text_detail?.error;
                      error_count++;
                    } else if (
                      sb_rc_response_text_detail?.params?.status ===
                      'SUCCESSFUL'
                    ) {
                      loglist[i].status = true;
                      loglist[i].error = {};
                      success_count++;
                    }
                  } else {
                    loglist[i].status = false;
                    loglist[i].error = 'Duplicate Entry Found.';
                    duplicate_count++;
                  }
                }
              } else {
                loglist[i].status = false;
                loglist[i].error = 'Duplicate Entry Found.';
                duplicate_count++;
              }
            } catch (e) {
              console.log(e);
              iserror = true;
              loglist[i].status = false;
              loglist[i].error = 'System Exception ! Please Try Again.';
              loglist[i].errorlog = JSON.stringify(e);
              error_count++;
            }
          }
        }
        return response.status(200).send({
          success: true,
          status: 'student_register_bulk_api_success',
          iserror: iserror,
          message: 'Student Register Bulk API Success.',
          error_count: error_count,
          success_count: success_count,
          duplicate_count: duplicate_count,
          result: loglist,
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

  //studentList
  async studentList(
    token: string,
    grade: string,
    acdemic_year: string,
    aadhaar_status: string,
    response: Response,
  ) {
    if (token && grade && acdemic_year) {
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
        const sb_rc_search = await this.sbrcService.sbrcSearchEL('TeacherV1', {
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
          const sb_rc_search_student = await this.sbrcService.sbrcSearchEL(
            'StudentV2',
            aadhaar_status === 'all'
              ? {
                  filters: {
                    school_udise: {
                      eq: schoolUdise,
                    },
                  },
                }
              : {
                  filters: {
                    school_udise: {
                      eq: schoolUdise,
                    },
                    aadhaar_status: {
                      eq: aadhaar_status,
                    },
                  },
                },
          );
          if (sb_rc_search_student?.error) {
            return response.status(501).send({
              success: false,
              status: 'sb_rc_search_error',
              message: 'System Search Error ! Please try again.',
              result: sb_rc_search_student?.error,
            });
          } else if (sb_rc_search_student.length === 0) {
            return response.status(200).send({
              success: true,
              status: 'sb_rc_search_no_found',
              message: 'Data Not Found in System.',
              result: [],
            });
          } else {
            let student_list = [];
            for (let i = 0; i < sb_rc_search_student.length; i++) {
              const sb_rc_search_student_detail =
                await this.sbrcService.sbrcSearchEL('StudentDetailV2', {
                  filters: {
                    student_id: {
                      eq: sb_rc_search_student[i].osid,
                    },
                    grade: {
                      eq: grade,
                    },
                    acdemic_year: {
                      eq: acdemic_year,
                    },
                    claim_status: {
                      eq: 'approved',
                    },
                  },
                });
              if (sb_rc_search_student_detail?.error) {
              } else if (sb_rc_search_student_detail.length !== 0) {
                student_list.push({
                  student: sb_rc_search_student[i],
                  studentdetail: sb_rc_search_student_detail[0],
                });
              }
            }
            return response.status(200).send({
              success: true,
              status: 'sb_rc_search_found',
              message: 'Data Found in System.',
              result: student_list,
            });
          }
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

  //studentUpdate
  async studentUpdate(
    token: string,
    studentNewData: any,
    osid: string,
    response: Response,
  ) {
    if (token && studentNewData && osid) {
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
        //update student
        // sunbird registery student
        let sb_rc_response_text = await this.sbrcService.sbrcUpdateEL(
          studentNewData,
          'StudentV2',
          osid,
        );
        if (sb_rc_response_text?.error) {
          return response.status(400).send({
            success: false,
            status: 'sb_rc_update_error',
            message: 'System Update Error ! Please try again.',
            result: sb_rc_response_text?.error,
          });
        } else if (sb_rc_response_text?.params?.status === 'SUCCESSFUL') {
          //update detail in student detail
          return response.status(200).send({
            success: true,
            status: 'sb_rc_update_success',
            message: 'System Update Success',
            result: sb_rc_response_text,
            studentNewData: studentNewData,
          });
        } else {
          return response.status(400).send({
            success: false,
            status: 'sb_rc_update_error',
            message: 'System Update Error ! Please try again.',
            result: sb_rc_response_text,
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

  //studentAadhaarVerify
  async studentAadhaarVerify(
    token: string,
    studentData: any,
    response: Response,
  ) {
    if (token && studentData) {
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
        const aadhaar_id = await this.aadharService.decryptaadhaar(
          studentData?.aadhaar_enc,
        );
        const aadhar_data = await this.aadharService.aadhaarDemographic(
          aadhaar_id,
          studentData?.student_name,
          studentData?.dob,
          studentData?.gender,
        );
        //console.log(aadhar_data);
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
                result: uuid,
              });
            } else {
              //update student
              // sunbird registery student
              let sb_rc_response_text = await this.sbrcService.sbrcUpdateEL(
                {
                  aadhar_token: uuid,
                  aadhaar_status: 'verified',
                },
                'StudentV2',
                studentData?.osid,
              );
              if (sb_rc_response_text?.error) {
                return response.status(400).send({
                  success: false,
                  status: 'sb_rc_update_error',
                  message: 'System Update Error ! Please try again.',
                  result: sb_rc_response_text?.error,
                });
              } else if (sb_rc_response_text?.params?.status === 'SUCCESSFUL') {
                //update detail in student detail
                return response.status(200).send({
                  success: true,
                  status: 'sb_rc_aadhar_verify_success',
                  message: 'Aadhaar Verification Completed.',
                  result: sb_rc_response_text,
                });
              } else {
                return response.status(400).send({
                  success: false,
                  status: 'sb_rc_update_error',
                  message: 'System Update Error ! Please try again.',
                  result: sb_rc_response_text,
                });
              }
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

  //studentBulkCredentials
  async studentBulkCredentials(
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
        //get common detail
        //credentialSubjectCommon
        let grade = requestbody?.credentialSubjectCommon?.grade;
        let academicYear = requestbody?.credentialSubjectCommon?.academicYear;
        //issuerDetail
        let did = requestbody?.issuerDetail?.did;
        let schoolName = requestbody?.issuerDetail?.schoolName;
        let schemaId = requestbody?.issuerDetail?.schemaId;
        //generate schema
        var schemaRes = await this.credService.generateSchema(schemaId);
        const credentialSubject = requestbody?.credentialSubject;
        let iserror = false;
        let loglist = [];
        let error_count = 0;
        let success_count = 0;
        if (credentialSubject) {
          for (let i = 0; i < credentialSubject.length; i++) {
            loglist[i] = {};
            loglist[i].credentialSubject = credentialSubject[i];
            try {
              const credentialSubjectItem = credentialSubject[i];
              let id = credentialSubjectItem?.id;
              let enrolledOn = credentialSubjectItem?.enrolledOn;
              let studentName = credentialSubjectItem?.studentName;
              let guardianName = credentialSubjectItem?.guardianName;
              let issuanceDate = credentialSubjectItem?.issuanceDate;
              let expirationDate = credentialSubjectItem?.expirationDate;
              let student_id = credentialSubjectItem?.student_id;
              let school_id = credentialSubjectItem?.school_id;
              let osid = credentialSubjectItem?.osid;
              //issueCredentials obj
              let obj = {
                issuerId: did,
                credSchema: schemaRes,
                credentialSubject: {
                  id: id,
                  enrolled_on: enrolledOn,
                  student_name: studentName,
                  guardian_name: guardianName,
                  grade: grade,
                  school_name: schoolName,
                  academic_year: academicYear,
                  student_id: student_id,
                  school_id: school_id,
                },
                issuanceDate: issuanceDate,
                expirationDate: expirationDate,
              };
              //console.log('obj', obj);
              const cred = await this.credService.issueCredentialsEL(obj);
              if (cred?.error) {
                iserror = true;
                loglist[i].status = false;
                loglist[i].error =
                  'Unable to Issue Credentials ! Please Try Again.';
                loglist[i].errorlog = cred?.error;
                error_count++;
              } else {
                //update status
                // sunbird registery student
                let sb_rc_response_text = await this.sbrcService.sbrcUpdateEL(
                  {
                    claim_status: 'issued',
                  },
                  'StudentDetailV2',
                  osid,
                );
                if (sb_rc_response_text?.error) {
                  iserror = true;
                  loglist[i].status = false;
                  loglist[i].error =
                    'Unable to Update Student Data ! Please Try Again.';
                  loglist[i].errorlog = sb_rc_response_text?.error;
                  error_count++;
                } else if (
                  sb_rc_response_text?.params?.status === 'SUCCESSFUL'
                ) {
                  loglist[i].status = true;
                  loglist[i].error = {};
                  success_count++;
                } else {
                  iserror = true;
                  loglist[i].status = false;
                  loglist[i].error =
                    'Unable to Update Student Details ! Please Try Again.';
                  loglist[i].errorlog = sb_rc_response_text;
                  error_count++;
                }
              }
            } catch (e) {
              iserror = true;
              loglist[i].status = false;
              loglist[i].error = 'System Exception ! Please Try Again.';
              loglist[i].errorlog = JSON.stringify(e);
              error_count++;
            }
          }
        }
        return response.status(200).send({
          success: true,
          status: 'student_cred_bulk_api_success',
          iserror: iserror,
          message: 'Student Cred Bulk API Success.',
          error_count: error_count,
          success_count: success_count,
          result: loglist,
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

  //21 june demo  q2 new api

  //getAadhaarToken
  async registerLearner(
    name: string,
    dob: string,
    gender: string,
    aadhar_id: string,
    username: string,
    password: string,
    response: Response,
  ) {
    if (name && dob && gender && aadhar_id && username && password) {
      const aadhar_data = await this.aadharService.aadhaarDemographic(
        aadhar_id,
        name,
        dob,
        gender,
      );

      //console.log(aadhar_data);
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
              result: uuid,
            });
          } else {
            //generate did or find did
            var aadhar_token = uuid;

            // find student
            let searchSchema = {
              filters: {
                aadhar_token: {
                  eq: aadhar_token,
                },
              },
            };
            const studentDetails = await this.sbrcService.sbrcSearch(
              searchSchema,
              'Learner',
            );
            console.log('Learner Details', studentDetails);
            if (studentDetails.length == 0) {
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
                let response_text =
                  await this.keycloakService.registerUserKeycloak(
                    username,
                    password,
                    clientToken,
                  );
                console.log('registerUserKeycloak', response_text);
                if (response_text?.error) {
                  return response.status(400).send({
                    success: false,
                    status: 'keycloak_register_duplicate',
                    message: 'You entered username Account Already Present in Keycloak.',
                    result: null,
                  });
                } else {
                  //register and create account in sunbird rc
                  let inviteSchema = {
                    name: name,
                    dob: dob,
                    did: '',
                    username: username,
                    aadhar_token: aadhar_token,
                  };
                  console.log('inviteSchema', inviteSchema);
                  let createStudent = await this.sbrcService.sbrcInvite(
                    inviteSchema,
                    'Learner',
                  );
                  console.log('createStudent', createStudent);
                  if (createStudent) {
                    return response.status(200).send({
                      success: true,
                      status: 'sbrc_register_success',
                      message:
                        'User Account Registered. Login using username and password.',
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
                        message: 'Unable to Register Learner. Try Again.',
                        result: null,
                      });
                    } else {
                      return response.status(400).send({
                        success: false,
                        status: 'sbrc_invite_error',
                        message: 'Unable to Register Learner. Try Again.',
                        result: null,
                      });
                    }
                  }
                }
              }
            } else if (studentDetails.length > 0) {
              if (studentDetails[0].username != '') {
                return response.status(400).send({
                  success: false,
                  status: 'sbrc_register_duplicate',
                  message:
                    `You entered account details already linked to an existing Keycloak account, which has a username ${studentDetails[0].username}. You cannot set a new username for this Aadhar token. Login using the linked username and password.`,
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
                      message: 'You entered username Account Already Present in Keycloak.',
                      result: null,
                    });
                  } else {
                    //update username and register in keycloak
                    //update username
                    let updateRes = await this.sbrcService.sbrcUpdate(
                      { username: username },
                      'Learner',
                      studentDetails[0].osid,
                    );
                    if (updateRes) {
                      return response.status(200).send({
                        success: true,
                        status: 'sbrc_register_success',
                        message:
                          'User Account Registered. Login using username and password.',
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
                          message: 'Unable to Register Learner. Try Again.',
                          result: null,
                        });
                      } else {
                        return response.status(200).send({
                          success: false,
                          status: 'sbrc_update_error',
                          message:
                            'Unable to Update Learner Username ! Please Try Again.',
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
                message: 'Unable to search Learner. Try Again.',
                result: null,
              });
            }
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

  //credentialsStudent
  async getDIDLearner(token: string, response: Response) {
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
        const sb_rc_search = await this.sbrcService.sbrcSearchEL('Learner', {
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
        } else if (sb_rc_search.length !== 1) {
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
            result: sb_rc_search[0].did,
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

  //getDetailLearner
  async getDetailLearner(token: string, response: Response) {
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
        const sb_rc_search = await this.sbrcService.sbrcSearchEL('Learner', {
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
        } else if (sb_rc_search.length !== 1) {
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
