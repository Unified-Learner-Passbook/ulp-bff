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

  async registerStudent(
    aadhaarid: string,
    studentname: string,
    schoolname: string,
    studentid: string,
    phoneno: string,
  ) {
    if (aadhaarid && studentname && schoolname && studentid && phoneno) {
      const clientToken = await this.getClientToken();
      return {
        statusCode: 200,
        success: true,
        message:
          'got all body variable token : ' +
          clientToken +
          ' ' +
          this.keycloakCred.client_secret,
      };
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
        console.log(JSON.stringify(response.data));
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
