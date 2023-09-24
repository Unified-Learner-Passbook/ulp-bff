import {
  Controller,
  Get,
  Post,
  Res,
  Headers,
  Body,
  Put,
  Head,
} from '@nestjs/common';
import { ClaimAttestService } from './claimAttest.service';
import { Response, response } from 'express';

@Controller('v1/claim')
export class ClaimAttestController {
  constructor(private readonly claimAttestService: ClaimAttestService) {}

  @Get('/test')
  async test() {
    return this.claimAttestService.test();
  }
  @Post('/sent')
  async sent(
    @Headers('Authorization') auth: string,
    @Body('credential_schema_id') credential_schema_id: string,
    @Body('credentialSubject') credentialSubject: object,
    @Res() response: Response,
  ) {
    const jwt = auth.replace('Bearer ', '');
    return this.claimAttestService.sent(
      jwt,
      credential_schema_id,
      credentialSubject,
      response,
    );
  }
  @Post('/search')
  async search(
    @Headers('Authorization') auth: string,
    @Body('type') type: string,
    @Res() response: Response,
  ) {
    const jwt = auth.replace('Bearer ', '');
    return this.claimAttestService.search(jwt, type, response);
  }
  @Put('/attest')
  async attest(
    @Headers('Authorization') auth: string,
    @Body('claim_status') claim_status: string,
    @Body('claim_os_id') claim_os_id: string,
    @Body('issuanceDate') issuanceDate: string,
    @Body('expirationDate') expirationDate: string,

    @Res() response: Response,
  ) {
    const jwt = auth.replace('Bearer ', '');
    return this.claimAttestService.attest(
      jwt,
      claim_status,
      claim_os_id,
      issuanceDate,
      expirationDate,
      response,
    );
  }
}
