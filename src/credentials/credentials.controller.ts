import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Res,
  Headers,
} from '@nestjs/common';
import { CredentialsService } from './credentials.service';
import { SingleCredentialDto } from './dto/singlecred-dto';
import { BulkCredentialDto } from './dto/bulkCred-dto';
import { Response } from 'express';

@Controller('/v1/credentials')
export class CredentialsController {
  constructor(private readonly credentialsService: CredentialsService) {}

  @Post('/upload/:type')
  bulkUpload(
    @Query() query: { type: string },
    @Param('type') type: string,
    @Body() payload: BulkCredentialDto,
    @Res() response: Response,
  ) {
    console.log('body', payload);
    console.log('query', query.type);
    console.log('params', type);

    if (type === 'proofOfAssessment') {
      var schemaId = process.env.PROOF_OF_ASSESSMENT;
    }
    if (type === 'proofOfEnrollment') {
      var schemaId = process.env.PROOF_OF_ENROLLMENT;
    }
    if (type === 'proofOfBenifits') {
      var schemaId = process.env.PROOF_OF_BENIFIT;
    }
    return this.credentialsService.issueBulkCredential(
      payload,
      schemaId,
      type,
      response,
    );
  }

  @Get('/getSchema/:id')
  getSchema(@Param('id') id: string, @Res() response: Response) {
    return this.credentialsService.getSchema(id, response);
  }

  @Post('/approveStudentv2')
  approveStudentv2(
    @Body() payload: SingleCredentialDto,
    @Res() response: Response,
  ) {
    var schemaId = process.env.PROOF_OF_ENROLLMENT;

    return this.credentialsService.issueSingleCredential(
      payload,
      schemaId,
      response,
    );
  }

  @Post('/rejectStudentv2')
  rejectStudentv2(
    @Body() payload: SingleCredentialDto,
    @Res() response: Response,
  ) {
    return this.credentialsService.rejectStudent(payload, response);
  }

  //get certificate id
  @Get('/get/:id')
  async getCredId(
    @Headers('Authorization') auth: string,
    @Param('id') id: string,
    @Res() response: Response,
  ) {
    const jwt = auth.replace('Bearer ', '');
    return this.credentialsService.getCredId(jwt, id, response);
  }
}
