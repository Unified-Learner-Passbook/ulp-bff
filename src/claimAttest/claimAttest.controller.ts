import { Controller, Get,Post,Res ,Headers} from '@nestjs/common';
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
        @Res() response:Response
        ){
        return this.claimAttestService.sent(token,response);
    }
    @Post('/search')
    search(){
        return this.claimAttestService.search();
    }
    @Post('/attest')
    attest(){
        return this.claimAttestService.attest();
    }
}