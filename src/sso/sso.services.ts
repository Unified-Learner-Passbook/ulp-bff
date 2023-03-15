import { Injectable, StreamableFile } from '@nestjs/common';

//custom imports
import axios from 'axios';
import { createWriteStream, writeFile } from 'fs';
import { response, Response } from 'express';
import * as wkhtmltopdf from 'wkhtmltopdf';

@Injectable()
export class SSOService {
  //axios call
  qs = require('qs');
  //keycloak config
  keycloakCred = {
    grant_type: 'client_credentials',
    client_id: process.env.CLIENT_ID,
    client_secret: process.env.CLIENT_SECRET,
  };

  //registerStudent
  async registerStudent(
    aadhaarid: string,
    studentname: string,
    schoolname: string,
    schoolid: string,
    studentid: string,
    phoneno: string,
    response: Response,
  ) {
    if (
      aadhaarid &&
      studentname &&
      schoolname &&
      schoolid &&
      studentid &&
      phoneno
    ) {
      const clientToken = await this.getClientToken();
      if (clientToken?.error) {
        return response.status(400).send({
          success: false,
          status: 'keycloak_client_token_error',
          message: 'Bad Request for Keycloak Client Token',
          log: clientToken?.error,
        });
      } else {
        const issuerRes = await this.generateDid(studentid);
        if (issuerRes?.error) {
          return response.status(400).send({
            success: false,
            status: 'did_generate_error',
            message: 'DID Generate Failed. Try Again.',
            log: issuerRes?.error,
          });
        } else {
          let did = issuerRes[0].verificationMethod[0].controller;

          //register student
          let data = JSON.stringify({
            enabled: 'true',
            username: studentid.toString(),
            credentials: [
              {
                type: 'password',
                value: '1234',
                temporary: false,
              },
            ],
          });

          let config = {
            method: 'post',
            url:
              process.env.KEYCLOAK_URL +
              'admin/realms/' +
              process.env.REALM_ID +
              '/users',
            headers: {
              'content-type': 'application/json',
              Authorization: 'Bearer ' + clientToken?.access_token,
            },
            data: data,
          };
          let response_text = null;
          await axios(config)
            .then(function (response) {
              //console.log(JSON.stringify(response.data));
              response_text = response.data;
            })
            .catch(function (error) {
              //console.log(error);
              response_text = { error: error };
            });

          if (response_text?.error) {
            return response.status(400).send({
              success: false,
              status: 'keycloak_register_duplicate',
              message: 'Student Already Registered in Keycloak',
              log: response_text?.error,
            });
          } else {
            let data = JSON.stringify({
              did: did,
              aadhaarID: aadhaarid.toString(),
              studentName: studentname.toString(),
              schoolName: schoolname.toString(),
              schoolID: schoolid.toString(),
              studentSchoolID: studentid.toString(),
              phoneNo: phoneno.toString(),
            });

            let config_sb_rc = {
              method: 'post',
              url: process.env.REGISTRY_URL + 'api/v1/Student/invite',
              headers: {
                'content-type': 'application/json',
              },
              data: data,
            };

            let sb_rc_response_text = null;
            await axios(config_sb_rc)
              .then(function (response) {
                //console.log(JSON.stringify(response.data));
                sb_rc_response_text = response.data;
              })
              .catch(function (error) {
                //console.log(error);
                sb_rc_response_text = { error: error };
              });
            if (sb_rc_response_text?.error) {
              return response.status(400).send({
                success: false,
                status: 'sb_rc_register_error',
                message: 'Sunbird RC Student Registration Failed',
                log: sb_rc_response_text?.error,
              });
            } else if (sb_rc_response_text?.params?.status === 'SUCCESSFUL') {
              return response.status(201).send({
                success: true,
                status: 'registered',
                message:
                  'Student Account Created in Keycloak and Registered in Sunbird RC',
                log: sb_rc_response_text,
              });
            } else {
              return response.status(400).send({
                success: false,
                status: 'sb_rc_register_duplicate',
                message: 'Student Already Registered in Sunbird RC',
                log: sb_rc_response_text,
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
        log: 'Invalid Request. Not received All Parameters.',
      });
    }
  }

  //loginStudent
  async loginStudent(username: string, password: string, response: Response) {
    if (username && password) {
      const studentToken = await this.getStudentToken(username, password);
      if (studentToken?.error) {
        return response.status(400).send({
          success: false,
          status: 'keycloak_invalid_credentials',
          message: 'Incorrect Username or Password',
          log: studentToken?.error,
        });
      } else {
        const sb_rc_search = await this.searchStudent(username);
        if (sb_rc_search?.error) {
          return response.status(400).send({
            success: false,
            status: 'sb_rc_search_error',
            message: 'Sunbird RC Student Search Failed',
            log: sb_rc_search?.error,
          });
        } else if (sb_rc_search.length !== 1) {
          return response.status(404).send({
            success: false,
            status: 'sb_rc_no_found',
            message: 'Student Not Found in Sunbird RC',
          });
        } else {
          return response.status(302).send({
            success: true,
            status: 'login_success',
            message: 'Login Success',
            data: sb_rc_search,
            token: studentToken?.access_token,
          });
        }
      }
    } else {
      return response.status(400).send({
        success: false,
        status: 'invalid_request',
        message: 'Invalid Request. Not received All Parameters.',
        log: 'Invalid Request. Not received All Parameters.',
      });
    }
  }

  //getDIDStudent
  async getDIDStudent(studentid: string, response: Response) {
    if (studentid) {
      const sb_rc_search = await this.searchStudent(studentid);
      if (sb_rc_search?.error) {
        return response.status(400).send({
          success: false,
          status: 'sb_rc_search_error',
          message: 'Sunbird RC Student Search Failed',
          log: sb_rc_search?.error,
        });
      } else if (sb_rc_search.length !== 1) {
        return response.status(404).send({
          success: false,
          status: 'sb_rc_no_did_found',
          message: 'Student DID not Found in Sunbird RC',
        });
      } else {
        return response.status(302).send({
          success: true,
          status: 'did_success',
          message: 'DID Found',
          data: sb_rc_search[0]?.did ? sb_rc_search[0].did : '',
        });
      }
    } else {
      return response.status(400).send({
        success: false,
        status: 'invalid_request',
        message: 'Invalid Request. Not received All Parameters.',
        log: 'Invalid Request. Not received All Parameters.',
      });
    }
  }

  //credentialsStudent
  async credentialsStudent(token: string, response: Response) {
    if (token) {
      const studentUsername = await this.verifyStudentToken(token);
      if (studentUsername?.error) {
        return response.status(400).send({
          success: false,
          status: 'keycloak_student_token_bad_request',
          message: 'Bad Request for Keycloak Student Token',
          log: studentUsername?.error,
        });
      } else if (!studentUsername?.preferred_username) {
        return response.status(400).send({
          success: false,
          status: 'keycloak_student_token_error',
          message: 'Keycloak Student Token Expired',
          log: studentUsername,
        });
      } else {
        const sb_rc_search = await this.searchStudent(
          studentUsername?.preferred_username,
        );
        if (sb_rc_search?.error) {
          return response.status(400).send({
            success: false,
            status: 'sb_rc_search_error',
            message: 'Sunbird RC Student Search Failed',
            log: sb_rc_search?.error,
          });
        } else if (sb_rc_search.length !== 1) {
          return response.status(404).send({
            success: false,
            status: 'sb_rc_no_did_found',
            message: 'Student DID not Found in Sunbird RC',
          });
        } else {
          let data = JSON.stringify({
            subjectId: sb_rc_search[0]?.did ? sb_rc_search[0].did : '',
          });

          let config = {
            method: 'post',
            url: process.env.CRED_URL + '/credentials',
            headers: {
              'Content-Type': 'application/json',
            },
            data: data,
          };
          let cred_search = null;
          await axios(config)
            .then(function (response) {
              //console.log(JSON.stringify(response.data));
              cred_search = response.data;
            })
            .catch(function (error) {
              //console.log(error);
              cred_search = { error: error };
            });
          if (cred_search?.error) {
            return response.status(400).send({
              success: false,
              status: 'cred_search_error',
              message: 'Student Credentials Search Failed',
              log: cred_search?.error,
            });
          } else if (cred_search.length === 0) {
            return response.status(404).send({
              success: false,
              status: 'cred_search_no_found',
              message: 'Student Credentials Not Found',
            });
          } else {
            return response.status(302).send({
              success: true,
              status: 'cred_success',
              message: 'Student Credentials Found',
              credential: cred_search,
            });
          }
        }
      }
    } else {
      return response.status(400).send({
        success: false,
        status: 'invalid_request',
        message: 'Invalid Request. Not received token.',
        log: 'Invalid Request. Not received token.',
      });
    }
  }

  //renderCredentials
  async renderCredentials(
    token: string,
    requestbody: any,
  ): Promise<string | StreamableFile> {
    if (token) {
      const studentUsername = await this.verifyStudentToken(token);
      if (studentUsername?.error) {
        return 'Keycloak Student Token Expired';
      } else if (!studentUsername?.preferred_username) {
        return 'Keycloak Student Token Expired';
      } else {
        var data = JSON.stringify(requestbody);

        var config = {
          method: 'post',
          url: process.env.CRED_URL + '/credentials/render',
          headers: {
            'Content-Type': 'application/json',
          },
          data: data,
        };

        let render_response = null;
        await axios(config)
          .then(function (response) {
            render_response = response.data;
          })
          .catch(function (error) {
            //console.log(error);
          });
        if (render_response == null) {
          return 'Cred Render API Failed';
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
      const studentUsername = await this.verifyStudentToken(token);
      if (studentUsername?.error) {
        return response.status(400).send({
          success: false,
          status: 'keycloak_student_token_bad_request',
          message: 'Bad Request for Keycloak Student Token',
          log: studentUsername?.error,
        });
      } else if (!studentUsername?.preferred_username) {
        return response.status(400).send({
          success: false,
          status: 'keycloak_student_token_error',
          message: 'Keycloak Student Token Expired',
          log: studentUsername,
        });
      } else {
        var data = JSON.stringify(requestbody);

        var config = {
          method: 'post',
          url: process.env.CRED_URL + '/credentials/render',
          headers: {
            'Content-Type': 'application/json',
          },
          data: data,
        };

        let render_response = null;
        await axios(config)
          .then(function (response) {
            //console.log(JSON.stringify(response.data));
            render_response = response.data;
          })
          .catch(function (error) {
            //console.log(error);
          });
        if (render_response == null) {
          return response.status(400).send({
            success: false,
            status: 'render_api_failed',
            message: 'Cred Render API Failed',
          });
        } else {
          return response.status(200).send({
            success: true,
            status: 'render_api_success',
            message: 'Cred Render API Success',
            render_response: render_response,
          });
        }
      }
    } else {
      return response.status(400).send({
        success: false,
        status: 'invalid_request',
        message: 'Invalid Request. Not received token.',
        log: 'Invalid Request. Not received token.',
      });
    }
  }

  //renderTemplate
  async renderTemplate(id: string, response: Response) {
    if (id) {
      var config = {
        method: 'get',
        url: process.env.SCHEMA_URL + '/rendering-template?id=' + id,
        headers: {},
      };
      let response_text = null;
      await axios(config)
        .then(function (response) {
          //console.log(JSON.stringify(response.data));
          response_text = response.data;
        })
        .catch(function (error) {
          //console.log(error);
        });
      if (response_text == null) {
        return response.status(400).send({
          success: false,
          status: 'render_template_api_failed',
          message: 'Render Template API Failed',
        });
      } else {
        return response.status(200).send({
          success: true,
          status: 'render_template_api_success',
          message: 'Render Template API Success',
          api_response: response_text,
        });
      }
    } else {
      return response.status(400).send({
        success: false,
        status: 'invalid_request',
        message: 'Invalid Request. Not received All Parameters.',
        log: 'Invalid Request. Not received All Parameters.',
      });
    }
  }

  //renderTemplateSchema
  async renderTemplateSchema(id: string, response: Response) {
    if (id) {
      var config = {
        method: 'get',
        url: process.env.SCHEMA_URL + '/rendering-template/' + id,
        headers: {},
      };
      let response_text = null;
      await axios(config)
        .then(function (response) {
          //console.log(JSON.stringify(response.data));
          response_text = response.data;
        })
        .catch(function (error) {
          //console.log(error);
        });
      if (response_text == null) {
        return response.status(400).send({
          success: false,
          status: 'render_template_schema_api_failed',
          message: 'Render Template Schema API Failed',
        });
      } else {
        return response.status(200).send({
          success: true,
          status: 'render_template_schema_api_success',
          message: 'Render Template Schema API Success',
          api_response: response_text,
        });
      }
    } else {
      return response.status(400).send({
        success: false,
        status: 'invalid_request',
        message: 'Invalid Request. Not received All Parameters.',
        log: 'Invalid Request. Not received All Parameters.',
      });
    }
  }

  //digilockertoken
  async digilockertoken(response: Response) {
    var data = this.qs.stringify({
      code: 'd06c336fe3ec04960553e96a13460adc33f7bd3e',
      grant_type: 'authorization_code',
      client_id: 'SWE24A2AF7',
      client_secret: 'e128b4f612658cdb80fe',
      redirect_uri:
        'https://ulp-registration-portal.netlify.app/digilocker-callback',
    });
    var config = {
      method: 'post',
      url: 'https://digilocker.meripehchaan.gov.in/public/oauth2/2/token',
      headers: {
        client_id: 'SWE24A2AF7',
        client_secret: 'e128b4f612658cdb80fe',
        'Content-Type': 'application/x-www-form-urlencoded',
        Cookie: 'c_name=141a716db662c0b5fb81e476080cc6bd',
      },
      data: data,
    };
    let response_digi = null;
    await axios(config)
      .then(function (response) {
        //console.log(JSON.stringify(response.data));
        response_digi = { data: response.data };
      })
      .catch(function (error) {
        //console.log(error);
        response_digi = { error: error };
      });

    response.status(200).send(response_digi);
  }
  //helper function
  //get client token
  async getClientToken() {
    let data = this.qs.stringify({
      grant_type: this.keycloakCred.grant_type,
      client_id: this.keycloakCred.client_id,
      client_secret: this.keycloakCred.client_secret,
    });
    let config = {
      method: 'post',
      url:
        process.env.KEYCLOAK_URL +
        'realms/' +
        process.env.REALM_ID +
        '/protocol/openid-connect/token',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
      },
      data: data,
    };

    let response_text = null;
    await axios(config)
      .then(function (response) {
        //console.log(JSON.stringify(response.data));
        response_text = response.data;
      })
      .catch(function (error) {
        //console.log(error);
        response_text = { error: error };
      });
    return response_text;
  }

  //get student token after login
  async getStudentToken(username: string, password: string) {
    let data = this.qs.stringify({
      client_id: this.keycloakCred.client_id,
      username: username.toString(),
      password: password,
      grant_type: 'password',
      client_secret: this.keycloakCred.client_secret,
    });
    let config = {
      method: 'post',
      url:
        process.env.KEYCLOAK_URL +
        'realms/' +
        process.env.REALM_ID +
        '/protocol/openid-connect/token',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
      },
      data: data,
    };

    let response_text = null;
    await axios(config)
      .then(function (response) {
        //console.log(JSON.stringify(response.data));
        response_text = response.data;
      })
      .catch(function (error) {
        //console.log(error);
        response_text = { error: error };
      });

    return response_text;
  }

  //generate did
  async generateDid(studentId: string) {
    let data = JSON.stringify({
      content: [
        {
          alsoKnownAs: [`did.${studentId}`],
          services: [
            {
              id: 'IdentityHub',
              type: 'IdentityHub',
              serviceEndpoint: {
                '@context': 'schema.identity.foundation/hub',
                '@type': 'UserServiceEndpoint',
                instance: ['did:test:hub.id'],
              },
            },
          ],
        },
      ],
    });

    let config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: `${process.env.DID_URL}/did/generate`,
      headers: {
        'Content-Type': 'application/json',
      },
      data: data,
    };
    let response_text = null;
    try {
      const response = await axios(config);
      //console.log("response did", response.data)
      response_text = response.data;
    } catch (error) {
      //console.log('error did', error);
      response_text = { error: error };
    }
    return response_text;
  }

  //search student
  async searchStudent(studentId: string) {
    let data = JSON.stringify({
      filters: {
        studentSchoolID: {
          eq: studentId.toString(),
        },
      },
    });

    let config = {
      method: 'post',
      url: process.env.REGISTRY_URL + 'api/v1/Student/search',
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

  //verify student token
  async verifyStudentToken(token: string) {
    let config = {
      method: 'get',
      url:
        process.env.KEYCLOAK_URL +
        'realms/' +
        process.env.REALM_ID +
        '/protocol/openid-connect/userinfo',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        Authorization: 'Bearer ' + token,
      },
    };

    let response_text = null;
    await axios(config)
      .then(function (response) {
        //console.log(JSON.stringify(response.data));
        response_text = response?.data;
      })
      .catch(function (error) {
        //console.log(error);
        response_text = { error: error };
      });

    return response_text;
  }
}
