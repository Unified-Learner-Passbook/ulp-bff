import { Body, Controller, Get, Param, Post, Query, Res } from '@nestjs/common';
import { CredentialsService } from './credentials.service';
import { CredentialDto } from './dto/credential-dto';



@Controller('/v1/credentials')
export class CredentialsController {

    constructor(private readonly credentialsService: CredentialsService) {}

    @Get('')
    testMethod() {
        return {message: "welcome to version 1.0"}
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

    @Post('/upload')
    bulkUpload(@Query() query: { type: string }, @Body() payload: CredentialDto) {
        console.log("body", payload)
        console.log("query", query.type)


        if (query.type === "proofOfAssessment") {
            //var schemaId = "did:ulpschema:098765";
            var schemaId = "clf0qfvna0000tj154706406y"
        }
        if (query.type === "proofOfEnrollment") {
            //var schemaId = "did:ulpschema:098765";
            var schemaId = "clf0rjgov0002tj15ml0fdest";
        }
        if (query.type === "proofOfBenifits") {
            //var schemaId = "did:ulpschema:098765";
            var schemaId = "clf0wvyjs0008tj154rc071i1"
        }

        return this.credentialsService.issueCredential(payload, schemaId);
        
    }
}
