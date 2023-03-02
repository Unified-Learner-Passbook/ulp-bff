import { Controller, Get, Param, Post, Body } from '@nestjs/common';
import { SSOService } from './sso.services';
//import KcAdminClient from '@keycloak/keycloak-admin-client';
// To configure the client, pass an object to override any of these  options:
// {
//   baseUrl: 'http://127.0.0.1:8080',
//   realmName: 'master',
//   requestConfig: {
//     /* Axios request config options https://github.com/axios/axios#request-config */
//   },
// }

@Controller('sso')
export class SSOController {
  constructor(private readonly ssoService: SSOService) {}

  @Post('/student/register')
  async registerStudent(
    @Body('username') username: string,
    @Body('name') name: string,
  ) {
    /*const kcAdminClientLocal = new KcAdminClient({
      baseUrl: 'https://ulp.uniteframework.io/auth',
      realmName: 'sunbird-rc',
    });
    // Authorize with username / password
    await kcAdminClientLocal.auth({
      username: 'admin',
      password: '8t6l@@cX2)',
      grantType: 'password',
      clientId: 'ulp-student',
    });*/

    return this.ssoService.registerStudent(username, name);
  }
}
