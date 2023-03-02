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
        var data = JSON.stringify({
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

        var config = {
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
          var data = JSON.stringify({
            did: aadhaarid,
            aadhaarID: aadhaarid,
            studentName: studentname,
            schoolName: schoolname,
            studentID: studentid,
            phoneNo: phoneno,
          });

          var config_sb_rc = {
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
        var data = JSON.stringify({
          filters: {
            aadhaarID: {
              eq: username,
            },
          },
        });

        var config = {
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

  //get client token
  async getClientToken() {
    var data = this.qs.stringify({
      grant_type: this.keycloakCred.grant_type,
      client_id: this.keycloakCred.client_id,
      client_secret: this.keycloakCred.client_secret,
    });
    var config = {
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
    var data = this.qs.stringify({
      client_id: this.keycloakCred.client_id,
      username: username,
      password: password,
      grant_type: 'password',
      client_secret: this.keycloakCred.client_secret,
    });
    var config = {
      method: 'post',
      url: 'https://ulp.uniteframework.io/auth/realms/sunbird-rc/protocol/openid-connect/token',
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
}
