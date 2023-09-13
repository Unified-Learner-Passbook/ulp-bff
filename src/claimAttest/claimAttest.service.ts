import { Injectable } from '@nestjs/common';
import { AxiosRequestConfig } from 'axios';
import { HttpService } from '@nestjs/axios';
import { response } from 'express';
import { SbrcService } from 'src/services/sbrc/sbrc.service';
import { KeycloakService } from 'src/services/keycloak/keycloak.service';

@Injectable()
export class ClaimAttestService {
  constructor(
    private readonly httpService: HttpService,
    private sbrcService: SbrcService,
    private keycloakService: KeycloakService,
  ) {}

  public test() {
    console.log('Test Function Success');
  }
  public async sent(token: string) {
    //verification of token
    const username = await this.verifyToken(token);
    if (username?.error) {
      return 'error1';
    } else {
      //retieve data from sbrc
      const search = await this.sbrcService.sbrcSearchEL('Learner', {
        filters: {
          username: {
            eq: username?.preferred_username,
          },
        },
      });
    }
    console.log('Sent Function Success');
  }
  public search() {
    console.log('Search Function Success');
  }
  public attest() {
    console.log('Attest Function Success');
  }
  async verifyToken(token: string) {
    if (token != null) {
      const url =
        process.env.KEYCLOAK_URL +
        'realms/' +
        process.env.REALM_ID +
        '/protocol/openid-connect/userinfo';

      console.log(url);

      const config: AxiosRequestConfig = {
        headers: {
          Authorization: token,
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
      console.log(response_text);

      return response_text;
    }
  }
}
