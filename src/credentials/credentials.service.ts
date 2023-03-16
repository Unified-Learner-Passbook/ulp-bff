//import { HttpService } from '@nestjs/axios';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import axios from 'axios';
import { it } from 'node:test';
import { CredentialDto } from './dto/credential-dto';
import { SingleCredentialDto } from './dto/singlecred-dto';
import { Response } from 'express';


const cred_url = process.env.CRED_URL || 'http://64.227.185.154:3002';
const did_url = process.env.DID_URL || 'http://64.227.185.154:3000';
const schema_url = process.env.SCHEMA_URL || 'http://64.227.185.154:3001';
const AADHAAR_DID_URL = process.env.AADHAAR_DID_URL || 'https://ulp.uniteframework.io/ulp-bff/v1/sso/student/getdid'
const registry_url =  process.env.REGISTRY_URL || 'https://ulp.uniteframework.io/registry/'

@Injectable()
export class CredentialsService {

    //constructor(private readonly httpService: HttpService) { }


    async issueBulkCredential(credentialPlayload: CredentialDto, schemaId: string, response: Response) {
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

            console.log("didRes 59", didRes)
            if (didRes) {
                let did = didRes.result
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
                if (cred) {
                    responseArray.push(cred)
                }
            }
        }

        console.log("responseArray.length", responseArray.length)
        if (responseArray.length > 0) {
            return response.status(200).send({
                success: true,
                status: 'Success',
                message: 'Bulk Credentials generated successfully!',
                result: responseArray
            })
        } else {
            return response.status(200).send({
                success: false,
                status: 'Success',
                message: 'Unable to generate did or crdentials',
                result: null
            })
        }
    }

    async issueSingleCredential(credentialPlayload: SingleCredentialDto, schemaId: string, response: Response) {
        console.log('credentialPlayload: ', credentialPlayload);
        console.log('schemaId: ', schemaId);

        var payload = credentialPlayload


        var issuerId = "did:ulp:f08f7782-0d09-4c47-aacb-9092113bc33e"
        console.log("issuerId", issuerId)
        //generate schema
        console.log("schemaId", schemaId)

        var schemaRes = await this.generateSchema(schemaId);

        console.log("schemaRes", schemaRes)



        let studentId = payload.credentialSubject.studentId;
        console.log("studentId", studentId)
        const didRes = await this.generateDid(studentId);
        console.log("didRes 59", didRes)


        if (didRes) {
            var did = didRes[0].verificationMethod[0].controller
            payload.credentialSubject.id = did

            //update did inside sbrc
            let osid = payload.credentialSubject.osid;
            const updateRes = await this.updateStudentDetails(osid, did);
            console.log("updateRes", updateRes)

            if(updateRes) {
                let obj = {
                    issuerId: issuerId,
                    credSchema: schemaRes,
                    credentialSubject: payload.credentialSubject
                }
                console.log("obj", obj)
                const cred = await this.issueCredentials(obj)
                if (cred) {
                    return response.status(200).send({
                        success: true,
                        status: 'Success',
                        message: 'Credentials generated successfully!',
                        result: cred
                    })
                } else {
                    return response.status(200).send({
                        success: false,
                        status: 'Success',
                        message: 'Unable to generate Credentials',
                        result: null
                    })
                }
            } else {
                return response.status(200).send({
                    success: false,
                    status: 'Success',
                    message: 'Unable to update did inside Registry',
                    result: null
                })
            }
        } else {
            return response.status(200).send({
                success: false,
                status: 'Success',
                message: 'Unable to generate did',
                result: null
            })
        }
    }

    async getSchema(id: string, response: Response) {

        console.log('id: 172', id);
        var schemaRes = await this.getCredSchema(id);

        console.log("schemaRes", schemaRes)


        if (schemaRes) {
            return response.status(200).send({
                success: true,
                status: 'Success',
                message: 'Credentials fetched successfully!',
                result: schemaRes
            })

        } else {
            return response.status(200).send({
                success: false,
                status: 'Success',
                message: 'Unable to fetch Credentials schema',
                result: null
            })
        }
    }


    //helper function
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

    async issueCredentials1(payload) {
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
            console.log("cred error", e.message)
        }
    }

    async issueCredentials(payload) {

        var data = JSON.stringify({
            "credential": {
                "@context": [
                    "https://www.w3.org/2018/credentials/v1",
                    "https://www.w3.org/2018/credentials/examples/v1"
                ],
                "id": "did:ulp:b4a191af-d86e-453c-9d0e-dd4771067235",
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
            "credentialSchemaId": payload.credSchema.id,
            "tags": [
                "tag1",
                "tag2",
                "tag3"
            ]
        });

        var config = {
            method: 'post',
            maxBodyLength: Infinity,
            url: 'http://64.227.185.154:3002/credentials/issue',
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
            console.log("cred error", e.message)
        }

    }

    async generateStudentDid(studentId) {

        console.log("studentId", studentId)

        var config = {
            method: 'get',
            maxBodyLength: Infinity,
            url: `https://ulp.uniteframework.io/ulp-bff/v1/sso/student/getdid/${studentId}`,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        try {
            let didRes = await axios(config)
            console.log("didRes 239", didRes.data)
            return didRes.data
        } catch (err) {
            console.log("err", err)
        }







    }

    async getCredSchema(id) {

        var config = {
            method: 'get',
            maxBodyLength: Infinity,
            url: `${schema_url}/schema/jsonld?id=${id}`,
            headers: {}
        };

        try {
            let schemaRes = await axios(config)
            console.log("schemaRes 402", schemaRes.data)
            return schemaRes.data
        } catch (err) {
            console.log("schemaRes err", err)
        }


    }

    async updateStudentDetails(osid, did) {
        console.log("osid", osid)
        console.log("did", did)
        var data = JSON.stringify({
            "did": did
        });

        var config = {
            method: 'put',
            maxBodyLength: Infinity,
            url: `${registry_url}api/v1/StudentDetail/${osid}`,
            headers: {
                'Content-Type': 'application/json'
            },
            data: data
        };

        try {
            let res = await axios(config)
            return res
        } catch(err) {
            console.log("update api err", err)
        }
        

    }

}
