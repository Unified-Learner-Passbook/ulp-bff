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
import { BulkCredentialDto } from './dto/bulkCred-dto';

@Controller('v1/client')
export class ClientController {
  constructor(private readonly clientService: ClientService) {}

  @Get('/test')
  getUser(@Res() response: Response) {
    const result = {
      success: true,
      message: 'Client API Working 3 April ' + process.env.TESTVAR,
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
  @Post('/bulk/upload/:type')
  async bulkRegister(
    @Body('clientId') clientId: string,
    @Body('clientSecret') clientSecret: string,
    @Param('type') type: string,
    @Body() payload: BulkCredentialDto,
    @Res() response: Response,
  ) {
    if (type === 'proofOfAssessment') {
      //var schemaId = "did:ulpschema:098765";
      var schemaId = 'clf0qfvna0000tj154706406y';
    }
    if (type === 'proofOfEnrollment') {
      //var schemaId = "did:ulpschema:098765";
      var schemaId = 'clf0rjgov0002tj15ml0fdest';
    }
    if (type === 'proofOfBenifits') {
      //var schemaId = "did:ulpschema:098765";
      var schemaId = 'clf0wvyjs0008tj154rc071i1';
    }
    return this.clientService.bulkRegister(
      clientId,
      clientSecret,
      payload,
      schemaId,
      response,
    );
  }
}
