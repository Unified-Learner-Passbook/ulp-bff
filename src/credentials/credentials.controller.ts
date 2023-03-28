import { Body, Controller, Get, Param, Post, Query, Res } from '@nestjs/common';
import { CredentialsService } from './credentials.service';
import { CredentialDto } from './dto/credential-dto';
import { SingleCredentialDto } from './dto/singlecred-dto';
import { BulkCredentialDto } from './dto/bulkCred-dto';
import { Response } from 'express';

@Controller('/v1/credentials')
export class CredentialsController {
  constructor(private readonly credentialsService: CredentialsService) {}

  @Get('')
  testMethod() {
    return { message: 'welcome to version 1.0' };
  }

  // @Get('/upload/:id')
  // getCredentialById(@Param() id: { id: string }) {
  //     console.log('id in getByIdController: ', id);
  //     //return this.credentialsService.getCredentialById(id?.id);
  //     return 'test cred'
  // }

  // @Get('query')
  // // 👇🏽 Using the `@Query()` decorator function to
  // // get all the query parameters in the request
  // getHello(@Query() query: { id: string }): string {
  //     return `Hello ${query.id}`;
  // }

  @Post('/upload1/:type')
  bulkUpload1(
    @Query() query: { type: string },
    @Param('type') type: string,
    @Body() payload: CredentialDto,
    @Res() response: Response,
  ) {
    console.log('body', payload);
    console.log('query', query.type);
    console.log('params', type);

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
    return this.credentialsService.issueBulkCredential1(
      payload,
      schemaId,
      response,
    );
  }

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
    return this.credentialsService.issueBulkCredential(
      payload,
      schemaId,
      response,
    );
  }

  @Post('/approveStudent')
  approveStudent(
    @Body() payload: SingleCredentialDto,
    @Res() response: Response,
  ) {
    console.log('body', payload);

    let schemaId = 'clf0rjgov0002tj15ml0fdest';

    return this.credentialsService.issueSingleCredential(
      payload,
      schemaId,
      response,
    );
  }

  @Get('/getSchema/:id')
  getSchema(@Param('id') id: string, @Res() response: Response) {
    console.log('id 67', id);

    return this.credentialsService.getSchema(id, response);
  }


  //v2
  @Post('/approveStudentv2')
  approveStudentv2(
    @Body() payload: SingleCredentialDto,
    @Res() response: Response,
  ) {
    console.log('body 90', payload);

    let schemaId = 'clf0rjgov0002tj15ml0fdest';

    return this.credentialsService.issueSingleCredentialv2(
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
    console.log('body 106', payload);

    return this.credentialsService.rejectStudentV2(
      payload,
      response,
    );
  }
}
