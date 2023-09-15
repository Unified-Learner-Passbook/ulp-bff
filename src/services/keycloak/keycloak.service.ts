import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { AxiosRequestConfig } from 'axios';

@Injectable()
export class KeycloakService {
  constructor(private readonly httpService: HttpService) {}

  qs = require('qs');
  //keycloak config
  keycloakCred = {
    grant_type: 'client_credentials',
    client_id: process.env.KEYCLOAK_CLIENT_ID,
    client_secret: process.env.KEYCLOAK_CLIENT_SECRET,
  };
  async getUserTokenAccount(token: string) {
    const url =
      process.env.KEYCLOAK_URL +
      'realms/' +
      process.env.KEYCLOAK_REALM_ID +
      '/account';

    const config: AxiosRequestConfig = {
      headers: {
        'content-type': 'application/json',
        Authorization: 'Bearer ' + token,
      },
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

    return response_text;
  }
  async verifyUserToken(token: string) {
    const url =
      process.env.KEYCLOAK_URL +
      'realms/' +
      process.env.KEYCLOAK_REALM_ID +
      '/protocol/openid-connect/userinfo';

    const config: AxiosRequestConfig = {
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        Authorization: 'Bearer ' + token,
      },
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
    return response_text;
  }

  //get client token
  async getClientToken() {
    let data = this.qs.stringify({
      grant_type: this.keycloakCred.grant_type,
      client_id: this.keycloakCred.client_id,
      client_secret: this.keycloakCred.client_secret,
    });
    console.log('data', data);
    const url =
      process.env.KEYCLOAK_URL +
      'realms/' +
      process.env.KEYCLOAK_REALM_ID +
      '/protocol/openid-connect/token';

    const config: AxiosRequestConfig = {
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
      },
      data: data,
    };

    let response_text = null;
    try {
      const observable = this.httpService.post(url, data, config);
      const promise = observable.toPromise();
      const response = await promise;
      console.log(JSON.stringify(response.data));
      response_text = response.data;
    } catch (e) {
      console.log(e);
      response_text = { error: e };
    }
    return response_text;
  }

  //get keycloak token after login
  async getKeycloakToken(username: string, password: string) {
    let data = this.qs.stringify({
      client_id: this.keycloakCred.client_id,
      username: username.toString(),
      password: password,
      grant_type: 'password',
      client_secret: this.keycloakCred.client_secret,
    });

    const url =
      process.env.KEYCLOAK_URL +
      'realms/' +
      process.env.KEYCLOAK_REALM_ID +
      '/protocol/openid-connect/token';

    const config: AxiosRequestConfig = {
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
      },
      data: data,
    };

    var response_text = null;
    try {
      const observable = this.httpService.post(url, data, config);
      const promise = observable.toPromise();
      const response = await promise;
      //console.log(JSON.stringify(response.data));
      response_text = response.data;
    } catch (e) {
      //console.log(e);
      response_text = { error: e };
    }

    return response_text;
  }

  // register student keycloak
  async registerStudentKeycloak(user, clientToken) {
    let data = JSON.stringify({
      enabled: 'true',
      username: user.studentId,
      credentials: [
        {
          type: 'password',
          value: '1234',
          temporary: false,
        },
      ],
    });

    const url =
      process.env.KEYCLOAK_URL +
      'admin/realms/' +
      process.env.KEYCLOAK_REALM_ID +
      '/users';

    const config: AxiosRequestConfig = {
      headers: {
        'content-type': 'application/json',
        Authorization: 'Bearer ' + clientToken?.access_token,
      },
      data: data,
    };
    var response_text = null;
    try {
      const observable = this.httpService.post(url, data, config);
      const promise = observable.toPromise();
      const response = await promise;
      //console.log(JSON.stringify(response.data));
      response_text = response.data;
    } catch (e) {
      //console.log(e);
      response_text = { error: e };
    }
    return response_text;
  }

  // register user in keycloak
  async registerUserKeycloak(username, password, clientToken) {
    let data = JSON.stringify({
      enabled: 'true',
      username: username,
      credentials: [
        {
          type: 'password',
          value: password,
          temporary: false,
        },
      ],
    });

    const url =
      process.env.KEYCLOAK_URL +
      'admin/realms/' +
      process.env.KEYCLOAK_REALM_ID +
      '/users';

    const config: AxiosRequestConfig = {
      headers: {
        'content-type': 'application/json',
        Authorization: 'Bearer ' + clientToken?.access_token,
      },
      data: data,
    };
    var response_text = null;
    try {
      const observable = this.httpService.post(url, data, config);
      const promise = observable.toPromise();
      const response = await promise;
      //console.log(JSON.stringify(response.data));
      response_text = response.data;
    } catch (e) {
      //console.log(e);
      response_text = { error: e };
    }

    return response_text;
  }

  // register user in keycloak
  async deleteUserKeycloak(username, clientToken) {
    try {
      //delete keycloak user
      //get client token
      let client_token = clientToken;
      let keycloak_user = username;
      //console.log('client_token', client_token);
      //get user id
      let search_keycloak_user = await new Promise<any>(async (done) => {
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
      });
      if (search_keycloak_user?.error) {
        return { error: search_keycloak_user?.error };
      } else {
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
        if (search_keycloak_user_delete?.error) {
          return { error: search_keycloak_user_delete?.error };
        } else {
          return { success: true };
        }
      }
    } catch (e) {
      return { error: e };
    }
  }
}
