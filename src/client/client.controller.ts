import {
  Controller,
  Get,
  Post,
  Body,
  Headers,
  Param,
  Res,
  StreamableFile,
  Req,
} from '@nestjs/common';

//custom imports
import axios from 'axios';
import { Response, Request } from 'express';
import { ClientService } from './client.services';

@Controller('v1/client')
export class ClientController {
  constructor(private readonly clientService: ClientService) {}

  @Get('/test')
  getUser(@Res() response: Response) {
    const CRED_URL = process.env.CRED_URL;
    const DID_URL = process.env.DID_URL;
    const SCHEMA_URL = process.env.SCHEMA_URL;
    const KEYCLOAK_URL = process.env.KEYCLOAK_URL;
    const REGISTRY_URL = process.env.REGISTRY_URL;
    const TESTVAR = process.env.TESTVAR;
    const KEYCLOAK_CLIENT_ID = process.env.KEYCLOAK_REALM_ID;
    
    const result = {
      success: true,
      message: 'Bulk Issuance API Working 12 September 23 ' + TESTVAR,
      CRED_URL: CRED_URL,
      DID_URL: DID_URL,
      SCHEMA_URL: SCHEMA_URL,
      KEYCLOAK_URL: KEYCLOAK_URL,
      REGISTRY_URL: REGISTRY_URL,
      KEYCLOAK_CLIENT_ID:KEYCLOAK_CLIENT_ID
    };
    response.status(200).send(result);
  }
  @Post('/register')
  async registerClient(@Body() requestbody: any, @Res() response: Response) {
    return this.clientService.registerClient(requestbody, response);
  }
  @Post('/search')
  async searchClient(
    @Body('clientName') clientName: string,
    @Res() response: Response,
  ) {
    return this.clientService.searchClient(clientName, response);
  }
}
