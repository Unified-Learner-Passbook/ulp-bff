import { Controller, Get, Param, Post, Body } from '@nestjs/common';
import { SSOService } from './sso.services';
import kcAdminClient from 'keycloak-admin';
// To configure the client, pass an object to override any of these  options:
// {
//   baseUrl: 'http://127.0.0.1:8080',
//   realmName: 'master',
//   requestConfig: {
//     /* Axios request config options https://github.com/axios/axios#request-config */
//   },
// }
//keycloak integration
//import { Roles } from 'nest-keycloak-connect';

export const keycloakConfig = {
  realm: 'sunbird-rc',
  clientId: 'ulp-user',
  clientSecret: '2630e6f7-4a40-4eb3-ad8b-f23a72114fa8',
  baseUrl: 'https://ulp.uniteframework.io/auth',
};

@Controller('sso')
export class SSOController {
  constructor(private readonly ssoService: SSOService) {}
  @Get('/user')
  getUser() {
    return `${this.ssoService.getHello()} from user`;
  }
  @Post('/student/register')
  async registerStudent(
    @Body('username') username: string,
    @Body('name') name: string,
  ) {
    const kcAdminClientLocal = new kcAdminClient({
      baseUrl: keycloakConfig.baseUrl,
      realmName: keycloakConfig.realm,
    });
    // Authorize with username / password
    await kcAdminClientLocal.auth({
      username: 'rushi',
      password: 'rushi',
      grantType: 'password',
      clientId: keycloakConfig.clientId,
      clientSecret: keycloakConfig.clientSecret,
    });

    return this.ssoService.registerStudent(username, name);
  }
}
