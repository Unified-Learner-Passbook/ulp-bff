import { Controller, Get,Post,Res ,Headers,Body} from '@nestjs/common';
import {ClaimAttestService} from './claimAttest.service';
import { Response, response } from 'express';

@Controller('v1/claim')
export class ClaimAttestController{
    constructor(private readonly claimAttestService: ClaimAttestService){}

    @Get('/test')
    test(){
        return this.claimAttestService.test();
    }
    @Post('/sent')
    sent(
        @Headers('Authorization') token:string,
        @Body('attest_school_id') attest_school_id:string,
        @Body('attest_school_name')attest_school_name:string, 
        @Body('credential_schema_id')credential_schema_id:string,
        @Body('credentialSubject')credentialSubject:object,
        @Res() response:Response
        ){
            
        return this.claimAttestService.sent(token,
            attest_school_id,
            attest_school_name,
            credential_schema_id,
            credentialSubject,
            response);
    }
    @Get('/search')
    search(@Headers('Authorization') token:string,
    @Res()response:Response
    ){
        return this.claimAttestService.search(token,response);
    }
    @Post('/attest')
    attest(){
        return this.claimAttestService.attest();
    }
}