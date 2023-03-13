//import { HttpService } from '@nestjs/axios';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import axios from 'axios';
import { it } from 'node:test';
import { CredentialDto } from './dto/credential-dto';
import { SuccessResponse } from "../success-response";
import { ErrorResponse } from 'src/error-response';
import { Response } from 'express';


const cred_url = process.env.CRED_URL || 'http://64.227.185.154:3002';
const did_url = process.env.DID_URL || 'http://64.227.185.154:3000';
const schema_url = process.env.SCHEMA_URL || 'http://64.227.185.154:3001';
const AADHAAR_DID_URL = process.env.AADHAAR_DID_URL || 'https://ulp.uniteframework.io/ulp-bff/v1/sso/student/getdid'

@Injectable()
export class CredentialsService {

    //constructor(private readonly httpService: HttpService) { }


    async issueCredential(credentialPlayload: CredentialDto, schemaId: string, response: Response) {
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

        //genrate did for each student
        //let generateDidPromises = payload.credentialSubject.map(iterator => this.generateStudentDid(iterator.aadhaarId))

        //console.log("generateDidPromises", generateDidPromises.length)

        var responseArray = []

        for (const iterator of payload.credentialSubject) {

            let studentId = iterator.studentId;
            console.log("studentId", studentId)
            const didRes = await this.generateStudentDid(studentId);

            console.log("didRes", didRes)
            if (didRes) {
                let did = didRes.did
                iterator.id = did
            }

            let obj = {
                issuerId: issuerId,
                credSchema: schemaRes,
                credentialSubject: iterator
            }
            console.log("obj", obj)

            if (iterator.id) {

                const cred = await this.issueCredentials(obj)
                //console.log("cred 34", cred)

                responseArray.push(cred)
            }


        }

        console.log("responseArray.length", responseArray.length)
        if (responseArray.length > 0) {
            //return responseArray;
            // return {
            //     statusCode: 200,
            //     success: true,
            //     message: 'Success',
            //     result: responseArray
            // };
            //this.successGetResponse(res, responseArray, 'api response');
            return response.status(200).send({
                success: true,
                status: 'Success',
                message: 'Bulk Credentials generated successfully!',
                result: responseArray
              })
        } else {
            // return {
            //     statusCode: 200,
            //     success: false,
            //     message: 'unable to generate did',
            // };
            //resp.errorResponse(res, "error", '500', "internl server error")
            return response.status(200).send({
                success: false,
                status: 'Success',
                message: 'Unable to generate did',
                result: null
              })
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

        } catch (e) {
            var error = new ErrorResponse({
                errorCode: e.response?.status,
                errorMessage: e.response?.data?.params?.errmsg,
            });
            console.log("cred error", e.data)
        }
    }

    async generateStudentDid(studentId) {

        var config = {
            method: 'get',
            maxBodyLength: Infinity,
            url: `https://ulp.uniteframework.io/ulp-bff/v1/sso/student/getdid/${studentId}`,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        try{
            let didRes = await axios(config)
            console.log("didRes", didRes)
            return didRes.data
        }catch(err) {
            console.log("err", err)
        }
        






    }

}
