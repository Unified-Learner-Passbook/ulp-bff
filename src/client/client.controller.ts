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
    const CRED_URL = process.env.CRED_URL;
    const DID_URL = process.env.DID_URL;
    const SCHEMA_URL = process.env.SCHEMA_URL;
    const KEYCLOAK_URL = process.env.KEYCLOAK_URL;
    const REGISTRY_URL = process.env.REGISTRY_URL;
    const TESTVAR = process.env.TESTVAR;
    const PROOF_OF_ENROLLMENT = process.env.PROOF_OF_ENROLLMENT;
    const result = {
      success: true,
      message: 'Bulk Issuance API Working 29 August 23 v4',
      CRED_URL: CRED_URL,
      DID_URL: DID_URL,
      SCHEMA_URL: SCHEMA_URL,
      KEYCLOAK_URL: KEYCLOAK_URL,
      REGISTRY_URL: REGISTRY_URL,
      PROOF_OF_ENROLLMENT: PROOF_OF_ENROLLMENT,
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

  //q2 new apis flow added on 21 june 23

  @Post('/getdid')
  async getDID(
    @Body('clientId') clientId: string,
    @Body('clientSecret') clientSecret: string,
    @Body('uniquetext') uniquetext: string,
    @Res() response: Response,
  ) {
    return this.clientService.getDID(
      clientId,
      clientSecret,
      uniquetext,
      response,
    );
  }

  @Post('/issuerregister')
  async getIssuerRegister(
    @Body('clientId') clientId: string,
    @Body('clientSecret') clientSecret: string,
    @Body('name') name: string,
    @Body('did') did: string,
    @Res() response: Response,
  ) {
    return this.clientService.getIssuerRegister(
      clientId,
      clientSecret,
      name,
      did,
      response,
    );
  }

  //client aadhaar
  @Post('/aadhaar')
  async getAadhaarToken(
    @Res() response: Response,
    @Body('aadhaar_id') aadhaar_id: string,
    @Body('aadhaar_name') aadhaar_name: string,
    @Body('aadhaar_dob') aadhaar_dob: string,
    @Body('aadhaar_gender') aadhaar_gender: string,
  ) {
    return this.clientService.getAadhaarToken(
      response,
      aadhaar_id,
      aadhaar_name,
      aadhaar_dob,
      aadhaar_gender,
    );
  }

  @Post('/bulk/getdata/:type')
  async bulkGetData(
    @Body('clientId') clientId: string,
    @Body('clientSecret') clientSecret: string,
    @Param('type') type: string,
    @Res() response: Response,
  ) {
    return this.clientService.bulkGetData(
      clientId,
      clientSecret,
      type,
      response,
    );
  }

  @Post('/bulk/uploadv2/:type')
  async bulkRegisterV2(
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
      var schemaId = process.env.PROOF_OF_ENROLLMENT;
    }
    if (type === 'proofOfBenifits') {
      //var schemaId = "did:ulpschema:098765";
      var schemaId = 'clf0wvyjs0008tj154rc071i1';
    }
    return this.clientService.bulkRegisterV2(
      clientId,
      clientSecret,
      payload,
      schemaId,
      response,
    );
  }
}
