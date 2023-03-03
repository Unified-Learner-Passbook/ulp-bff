import { Injectable } from '@nestjs/common';

//custom imports
import axios from 'axios';

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
    studentid: string,
    phoneno: string,
  ) {
    if (aadhaarid && studentname && schoolname && studentid && phoneno) {
      const clientToken = await this.getClientToken();
      if (clientToken === 'error') {
        return {
          statusCode: 200,
          success: false,
          message: 'keycloak_token_error',
        };
      } else {
        //register student
        let data = JSON.stringify({
          enabled: 'true',
          username: aadhaarid,
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
            message: 'keycloak_register_duplicate',
          };
        } else {
          const issuerRes = await this.generateDid(aadhaarid);
          /*console.log('issuerRes', issuerRes);
          console.log(
            'issuerRes',
            issuerRes[0].verificationMethod[0].controller,
          );*/
          let did = issuerRes[0].verificationMethod[0].controller;
          let data = JSON.stringify({
            did: did,
            aadhaarID: aadhaarid,
            studentName: studentname,
            schoolName: schoolname,
            studentID: studentid,
            phoneNo: phoneno,
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
              console.log(error);
            });
          if (sb_rc_response_text === 'error') {
            return {
              statusCode: 200,
              success: false,
              message: 'sb_rc_register_error',
            };
          } else if (sb_rc_response_text === 'duplicate') {
            return {
              statusCode: 200,
              success: false,
              message: 'sb_rc_register_duplicate',
            };
          } else {
            return {
              statusCode: 200,
              success: true,
              message: 'got all body variable token : ' + response_text,
            };
          }
        }
      }
    } else {
      return {
        statusCode: 200,
        success: false,
        message: 'invalid_body',
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
          message: 'keycloak_invalid_credentials',
        };
      } else {
        let data = JSON.stringify({
          filters: {
            aadhaarID: {
              eq: username,
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
            sb_rc_search = 'login_success';
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
            message: 'sb_rc_search_error',
          };
        } else {
          return {
            statusCode: 200,
            success: true,
            message: sb_rc_search,
            data: student_data,
            token: studentToken,
          };
        }
      }
    } else {
      return {
        statusCode: 200,
        success: false,
        message: 'invalid_body',
      };
    }
  }

  //getDIDStudent
  async getDIDStudent(aadhaarid: string) {
    if (aadhaarid) {
      let data = JSON.stringify({
        filters: {
          aadhaarID: {
            eq: aadhaarid,
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
          message: 'sb_rc_search_error',
        };
      } else if (sb_rc_search === 'not_found') {
        return {
          statusCode: 200,
          success: false,
          message: 'sb_rc_no_did_found',
        };
      } else {
        return {
          statusCode: 200,
          success: true,
          message: sb_rc_search,
          did: student_did,
        };
      }
    } else {
      return {
        statusCode: 200,
        success: false,
        message: 'invalid_body',
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
          message: 'keycloak_invalid_token',
        };
      } else {
        let data = JSON.stringify({
          filters: {
            aadhaarID: {
              eq: studentUsername,
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
            message: 'sb_rc_search_error',
          };
        } else if (sb_rc_search === 'not_found') {
          return {
            statusCode: 200,
            success: false,
            message: 'sb_rc_no_did_found',
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
              message: 'cred_search_error',
            };
          } else if (cred_search === 'not_found') {
            return {
              statusCode: 200,
              success: false,
              message: 'cred_search_no_found',
            };
          } else {
            return {
              statusCode: 200,
              success: true,
              message: cred_search,
              credential: cred_data,
            };
          }
        }
      }
    } else {
      return {
        statusCode: 200,
        success: false,
        message: 'invalid_token',
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
      username: username,
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
