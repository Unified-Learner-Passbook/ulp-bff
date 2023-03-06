import { Injectable, StreamableFile } from '@nestjs/common';

//custom imports
import axios from 'axios';
import { createWriteStream, writeFile } from 'fs';
import { Response } from 'express';
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
      if (clientToken === 'error') {
        return {
          statusCode: 200,
          success: false,
          status: 'keycloak_client_token_error',
          message: 'Keycloak Client Token Expired',
        };
      } else {
        const issuerRes = await this.generateDid(studentid);
        if (issuerRes.length === 0) {
          return {
            statusCode: 200,
            success: false,
            status: 'did_generate_error',
            message: 'DID Generate Failed. Try Again.',
          };
        } else {
          /*console.log('issuerRes', issuerRes);
        console.log(
          'issuerRes',
          issuerRes[0].verificationMethod[0].controller,
        );*/
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
              Authorization: 'Bearer ' + clientToken,
            },
            data: data,
          };
          let response_text = '';
          await axios(config)
            .then(function (response) {
              response_text = response?.data?.errorMessage ? 'error' : 'added';
              //console.log(JSON.stringify(response.data));
            })
            .catch(function (error) {
              response_text = 'error';
              //console.log(error);
            });
          if (response_text === 'error') {
            return {
              statusCode: 200,
              success: false,
              status: 'keycloak_register_duplicate',
              message: 'Student Already Registered in Keycloak',
            };
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

            let sb_rc_response_text = '';
            await axios(config_sb_rc)
              .then(function (response) {
                sb_rc_response_text =
                  response?.data?.params?.status === 'SUCCESSFUL'
                    ? 'added'
                    : 'duplicate';
                //console.log(JSON.stringify(response.data));
              })
              .catch(function (error) {
                sb_rc_response_text = 'error';
                //console.log(error);
              });
            if (sb_rc_response_text === 'error') {
              return {
                statusCode: 200,
                success: false,
                status: 'sb_rc_register_error',
                message: 'Sunbird RC Student Registration Failed',
              };
            } else if (sb_rc_response_text === 'duplicate') {
              return {
                statusCode: 200,
                success: false,
                status: 'sb_rc_register_duplicate',
                message: 'Student Already Registered in Sunbird RC',
              };
            } else {
              return {
                statusCode: 200,
                success: true,
                status: 'registered',
                message:
                  'Student Account Created in Keycloak and Registered in Sunbird RC',
              };
            }
          }
        }
      }
    } else {
      return {
        statusCode: 200,
        success: false,
        status: 'invalid_request',
        message: 'Invalid Request. Not received All Parameters.',
      };
    }
  }

  //loginStudent
  async loginStudent(username: string, password: string) {
    if (username && password) {
      const studentToken = await this.getStudentToken(username, password);
      if (studentToken === 'error') {
        return {
          statusCode: 200,
          success: false,
          status: 'keycloak_invalid_credentials',
          message: 'Incorrect Username or Password',
        };
      } else {
        let data = JSON.stringify({
          filters: {
            studentSchoolID: {
              eq: username.toString(),
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
        let sb_rc_search = '';
        let student_data = {};
        await axios(config)
          .then(function (response) {
            //console.log(JSON.stringify(response.data));
            let data_count = response.data.length;
            sb_rc_search = data_count === 1 ? 'login_success' : 'not_found';
            student_data = response.data;
          })
          .catch(function (error) {
            //console.log(error);
            sb_rc_search = 'error';
          });
        if (sb_rc_search === 'error') {
          return {
            statusCode: 200,
            success: false,
            status: 'sb_rc_search_error',
            message: 'Sunbird RC Student Search Failed',
          };
        } else if (sb_rc_search === 'not_found') {
          return {
            statusCode: 200,
            success: false,
            status: 'sb_rc_no_found',
            message: 'Student Not Found in Sunbird RC',
          };
        } else {
          return {
            statusCode: 200,
            success: true,
            status: sb_rc_search,
            message: 'Login Success',
            data: student_data,
            token: studentToken,
          };
        }
      }
    } else {
      return {
        statusCode: 200,
        success: false,
        status: 'invalid_request',
        message: 'Invalid Request. Not received All Parameters.',
      };
    }
  }

  //getDIDStudent
  async getDIDStudent(studentid: string) {
    if (studentid) {
      let data = JSON.stringify({
        filters: {
          studentSchoolID: {
            eq: studentid.toString(),
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
      let sb_rc_search = '';
      let student_did = '';
      await axios(config)
        .then(function (response) {
          //console.log(JSON.stringify(response.data));
          let data_count = response.data.length;
          sb_rc_search = data_count === 1 ? 'did_success' : 'not_found';
          student_did = response?.data[0]?.did ? response.data[0].did : '';
        })
        .catch(function (error) {
          //console.log(error);
          sb_rc_search = 'error';
        });
      if (sb_rc_search === 'error') {
        return {
          statusCode: 200,
          success: false,
          status: 'sb_rc_search_error',
          message: 'Sunbird RC Student Search Failed',
        };
      } else if (sb_rc_search === 'not_found') {
        return {
          statusCode: 200,
          success: false,
          status: 'sb_rc_no_did_found',
          message: 'Student DID not Found in Sunbird RC',
        };
      } else {
        return {
          statusCode: 200,
          success: true,
          status: sb_rc_search,
          message: 'DID Found',
          did: student_did,
        };
      }
    } else {
      return {
        statusCode: 200,
        success: false,
        status: 'invalid_request',
        message: 'Invalid Request. Not received All Parameters.',
      };
    }
  }

  //credentialsStudent
  async credentialsStudent(token: string) {
    if (token) {
      const studentUsername = await this.verifyStudentToken(token);
      if (studentUsername === 'error') {
        return {
          statusCode: 200,
          success: false,
          status: 'keycloak_student_token_error',
          message: 'Keycloak Student Token Expired',
        };
      } else {
        let data = JSON.stringify({
          filters: {
            studentSchoolID: {
              eq: studentUsername.toString(),
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
        let sb_rc_search = '';
        let student_did = '';
        await axios(config)
          .then(function (response) {
            //console.log(JSON.stringify(response.data));
            let data_count = response.data.length;
            sb_rc_search = data_count === 1 ? 'did_success' : 'not_found';
            student_did = response?.data[0]?.did ? response.data[0].did : '';
          })
          .catch(function (error) {
            //console.log(error);
            sb_rc_search = 'error';
          });
        if (sb_rc_search === 'error') {
          return {
            statusCode: 200,
            success: false,
            status: 'sb_rc_search_error',
            message: 'Sunbird RC Student Search Failed',
          };
        } else if (sb_rc_search === 'not_found') {
          return {
            statusCode: 200,
            success: false,
            status: 'sb_rc_no_did_found',
            message: 'Student DID not Found in Sunbird RC',
          };
        } else {
          let data = JSON.stringify({
            subjectId: student_did,
          });

          let config = {
            method: 'post',
            url: process.env.CRED_URL + '/credentials',
            headers: {
              'Content-Type': 'application/json',
            },
            data: data,
          };
          let cred_search = '';
          let cred_data = {};
          await axios(config)
            .then(function (response) {
              //console.log(JSON.stringify(response.data));
              let data_count = response.data.length;
              cred_search = data_count === 0 ? 'not_found' : 'cred_success';
              cred_data = data_count === 0 ? [] : response.data;
            })
            .catch(function (error) {
              //console.log(error);
              cred_search = 'error';
            });
          if (cred_search === 'error') {
            return {
              statusCode: 200,
              success: false,
              status: 'cred_search_error',
              message: 'Student Credentials Search Failed',
            };
          } else if (cred_search === 'not_found') {
            return {
              statusCode: 200,
              success: false,
              status: 'cred_search_no_found',
              message: 'Student Credentials Not Found',
            };
          } else {
            return {
              statusCode: 200,
              success: true,
              status: cred_search,
              message: 'Student Credentials Found',
              credential: cred_data,
            };
          }
        }
      }
    } else {
      return {
        statusCode: 200,
        success: false,
        status: 'student_token_no_found',
        message: 'Student Token Not Received',
      };
    }
  }

  //renderCredentials
  async renderCredentials(
    token: string,
    requestbody: any,
  ): Promise<string | StreamableFile> {
    if (token) {
      const studentUsername = await this.verifyStudentToken(token);
      if (studentUsername === 'error') {
        /*return {
          statusCode: 200,
          success: false,
          status: 'keycloak_student_token_error',
          message: 'Keycloak Student Token Expired',
        };*/
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
            //console.log(JSON.stringify(response.data));
            try {
              /*let writeStream = createWriteStream('test.pdf');
              writeStream.once('open', (fd) => {
                writeStream.write(Buffer.from(response.data, 'binary'));
                writeStream.on('finish', () => {
                  console.log('wrote all data to file');
                });
                writeStream.end();
              });*/
              /*writeFile(
                __dirname + '/test.pdf',
                response.data,
                'binary',
                (err) => {
                  if (err) {
                    console.log(err);
                  }
                  console.log('The file was saved!');
                },
              );*/
            } catch (e) {
              console.log(e);
            }
            render_response = response.data;
          })
          .catch(function (error) {
            //console.log(error);
          });
        if (render_response == null) {
          /*return {
            statusCode: 200,
            success: false,
            status: 'render_api_failed',
            message: 'Cred Render API Failed',
          };*/
          return 'Cred Render API Failed';
        } else {
          //return render_response;
          try {
            /*return {
              statusCode: 200,
              success: true,
              status: 'render_api_success',
              message: 'Cred Render API Success',
              render_response: render_response,
            };*/
            //return render_response;
            //return render_response;
            console.log('before sending file');
            return new StreamableFile(
              await wkhtmltopdf(render_response, {
                pageSize: 'A4',
                disableExternalLinks: true,
                disableInternalLinks: true,
                disableJavascript: true,
              }),
            );
          } catch (e) {
            console.log(e);
          }
        }
      }
    } else {
      /*return {
        statusCode: 200,
        success: false,
        status: 'student_token_no_found',
        message: 'Student Token Not Received',
      };*/
      return 'Student Token Not Received';
    }
  }

  //renderCredentialsHTML
  async renderCredentialsHTML(token: string, requestbody: any) {
    if (token) {
      const studentUsername = await this.verifyStudentToken(token);
      if (studentUsername === 'error') {
        return {
          statusCode: 200,
          success: false,
          status: 'keycloak_student_token_error',
          message: 'Keycloak Student Token Expired',
        };
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
          return {
            statusCode: 200,
            success: false,
            status: 'render_api_failed',
            message: 'Cred Render API Failed',
          };
        } else {
          return {
            statusCode: 200,
            success: true,
            status: 'render_api_success',
            message: 'Cred Render API Success',
            render_response: render_response,
          };
        }
      }
    } else {
      return {
        statusCode: 200,
        success: false,
        status: 'student_token_no_found',
        message: 'Student Token Not Received',
      };
    }
  }

  //renderTemplate
  async renderTemplate(id: string) {
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
        return {
          statusCode: 200,
          success: false,
          status: 'render_template_api_failed',
          message: 'Render Template API Failed',
        };
      } else {
        return {
          statusCode: 200,
          success: true,
          status: 'render_template_api_success',
          message: 'Render Template API Success',
          api_response: response_text,
        };
      }
    } else {
      return {
        statusCode: 200,
        success: false,
        status: 'invalid_request',
        message: 'Invalid Request. Not received All Parameters.',
      };
    }
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

    let response_text = '';
    await axios(config)
      .then(function (response) {
        //console.log(JSON.stringify(response.data));
        response_text = response?.data?.access_token
          ? response.data.access_token
          : 'error';
      })
      .catch(function (error) {
        //console.log(error);
        response_text = 'error';
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

    let response_text = '';
    await axios(config)
      .then(function (response) {
        //console.log(JSON.stringify(response.data));
        response_text = response?.data?.access_token
          ? response.data.access_token
          : 'error';
      })
      .catch(function (error) {
        //console.log(error);
        response_text = 'error';
      });

    return response_text;
  }

  //generate did
  async generateDid(aadhaarId: string) {
    let data = JSON.stringify({
      content: [
        {
          alsoKnownAs: [`did.${aadhaarId}`],
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

    try {
      const response = await axios(config);
      //console.log("response did", response.data)
      return response.data;
    } catch (error) {
      //console.log('error did', error);
      return [];
    }
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

    let response_text = '';
    await axios(config)
      .then(function (response) {
        //console.log(JSON.stringify(response.data));
        response_text = response?.data?.preferred_username
          ? response.data.preferred_username
          : 'error';
      })
      .catch(function (error) {
        //console.log(error);
        response_text = 'error';
      });

    return response_text;
  }
}
