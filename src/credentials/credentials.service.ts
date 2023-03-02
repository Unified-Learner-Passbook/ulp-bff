//import { HttpService } from '@nestjs/axios';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import axios from 'axios';
import { CredentialDto } from './dto/credential-dto';
const cred_url = process.env.CRED_URL || 'http://64.227.185.154:3002';
const did_url = process.env.DID_URL || 'http://64.227.185.154:3000';
const schema_url = process.env.SCHEMA_URL || 'http://64.227.185.154:3001';

@Injectable()
export class CredentialsService {

    //constructor(private readonly httpService: HttpService) { }

    async issueCredential(credentialPlayload: CredentialDto, schemaId: string) {
        console.log('credentialPlayload: ', credentialPlayload);
        console.log('schemaId: ', schemaId);



        var payload = credentialPlayload

        //let schoolDid = payload.schoolDid

        //const issuerRes = await middleware.generateDid(schoolDid);

        //console.log("issuerRes", issuerRes)

        //console.log("issuerRes", issuerRes[0].verificationMethod[0].controller)
        // var issuerId = issuerRes[0].verificationMethod[0].controller

        var issuerId = "did:ulp:f08f7782-0d09-4c47-aacb-9092113bc33e"
        console.log("issuerId", issuerId)
        //generate schema
        console.log("schemaId", schemaId)

        var schemaRes = await this.generateSchema(schemaId);

        console.log("schemaRes", schemaRes)


        var responseArray = []

        for (const iterator of payload.credentialSubject) {

            let studentId = iterator.studentId;
            //console.log("studentId", studentId)
            const credRes = await this.generateDid(studentId);

            //console.log("credRes", credRes[0].verificationMethod[0].controller)
            let credId = credRes[0].verificationMethod[0].controller

            let credentialSubject = {
                "id": credId,
                "grade": payload.grade,
                "programme": iterator.programme ? iterator.programme : "",
                "certifyingInstitute": iterator.certifyingInstitute ? iterator.certifyingInstitute : "",
                "evaluatingInstitute": iterator.evaluatingInstitute ? iterator.evaluatingInstitute : "",
            }

            iterator.issuerId = issuerId
            iterator.grade = payload.grade
            iterator.credId = credId
            iterator.credSchema = schemaRes
            iterator.credentialSubject = credentialSubject
            //console.log("iterator", iterator)


            const cred = await this.issueCredentials(iterator)
            //console.log("cred 34", cred)

            
                responseArray.push(cred)
            

        }

        console.log("responseArray.length", responseArray.length)
        if (responseArray.length > 0) {
            return responseArray;
            //this.successGetResponse(res, responseArray, 'api response');
        } else {
            //resp.errorResponse(res, "error", '500', "internl server error")
        }
    }

    async generateSchema(schemaId) {
        var config = {
            method: 'get',
            maxBodyLength: Infinity,
            url: `${schema_url}/schema/jsonld?id=${schemaId}`,
            headers: {}
        };
    
        try {
            const response = await axios(config)
            console.log("response schema", response.data)
            return response.data;
        } catch (error) {
            console.log("error schema", error)
        }
    }

    async generateDid(studentId) {
        var data = JSON.stringify({
            "content": [
                {
                    "alsoKnownAs": [
                        `did.${studentId}`
                    ],
                    "services": [
                        {
                            "id": "IdentityHub",
                            "type": "IdentityHub",
                            "serviceEndpoint": {
                                "@context": "schema.identity.foundation/hub",
                                "@type": "UserServiceEndpoint",
                                "instance": [
                                    "did:test:hub.id"
                                ]
                            }
                        }
                    ]
                }
            ]
        });
    
        var config = {
            method: 'post',
            maxBodyLength: Infinity,
            url: `${did_url}/did/generate`,
            headers: {
                'Content-Type': 'application/json'
            },
            data: data
        };
    
        try {
            const response = await axios(config)
            //console.log("response did", response.data)
            return response.data;
        } catch (error) {
            console.log("error did", error)
        }
    }

    async issueCredentials(payload) {
        var data = JSON.stringify({
            "credential": {
                "@context": [
                    "https://www.w3.org/2018/credentials/v1",
                    "https://www.w3.org/2018/credentials/examples/v1"
                ],
                "id": "",
                "type": [
                    "VerifiableCredential",
                    "UniversityDegreeCredential"
                ],
                "issuer": `${payload.issuerId}`,
                "issuanceDate": "2023-02-06T11:56:27.259Z",
                "expirationDate": "2023-02-08T11:56:27.259Z",
                "credentialSubject": payload.credentialSubject,
                "options": {
                    "created": "2020-04-02T18:48:36Z",
                    "credentialStatus": {
                        "type": "RevocationList2020Status"
                    }
                }
            },
            "credentialSchema": payload.credSchema
        });
    
        console.log("data 99", JSON.parse(data))
    
        var config = {
            method: 'post',
            maxBodyLength: Infinity,
            url: `${cred_url}/credentials/issue`,
            headers: {
                'Content-Type': 'application/json'
            },
            data: data
        };
    
        try {
    
            const response = await axios(config)
            console.log("cred response")
            return response.data;
    
        } catch (error) {
            console.log("cred error", error.data)
        }
    }

    

}