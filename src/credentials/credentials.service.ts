//import { HttpService } from '@nestjs/axios';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import axios from 'axios';
import { it } from 'node:test';
import { CredentialDto } from './dto/credential-dto';
import { SingleCredentialDto } from './dto/singlecred-dto';
import { BulkCredentialDto } from './dto/bulkCred-dto';
import { Response } from 'express';


const cred_url = process.env.CRED_URL || 'http://64.227.185.154:3002';
const did_url = process.env.DID_URL || 'http://64.227.185.154:3000';
const schema_url = process.env.SCHEMA_URL || 'http://64.227.185.154:3001';
const AADHAAR_DID_URL = process.env.AADHAAR_DID_URL || 'https://ulp.uniteframework.io/ulp-bff/v1/sso/student/getdid'
const registry_url = process.env.REGISTRY_URL || 'https://ulp.uniteframework.io/registry/'

@Injectable()
export class CredentialsService {

    //constructor(private readonly httpService: HttpService) { }


    async issueBulkCredential1(credentialPlayload: CredentialDto, schemaId: string, response: Response) {

        console.log('credentialPlayload: ', credentialPlayload);
        console.log('schemaId: ', schemaId);
        var payload = credentialPlayload

        var issuerId = credentialPlayload.issuer;
        console.log("issuerId", issuerId)

        //generate schema
        var schemaRes = await this.generateSchema(schemaId);
        console.log("schemaRes", schemaRes)

        //genrate did for each student
        //let generateDidPromises = payload.credentialSubject.map(iterator => this.generateStudentDid(iterator.aadhaarId))

        //console.log("generateDidPromises", generateDidPromises.length)

        var responseArray = []

        // bulk import
        for (const iterator of payload.credentialSubject) {

            var studentId = iterator.studentId;
            console.log("studentId", studentId)
            iterator.schoolName = credentialPlayload.schoolName ? credentialPlayload.schoolName : '';
            iterator.grade = credentialPlayload.grade;
            iterator.academicYear = credentialPlayload.academicYear;

            //generate did or find did

            // find student
            let name = iterator.studentName
            let dob = iterator.dob
            const studentDetails = await this.sbrcStudentSearch(name, dob)
            console.log("studentDetails", studentDetails)
            if (studentDetails.length > 0) {
                if (studentDetails[0]?.did) {
                    iterator.id = studentDetails[0].did
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
                } else {
                    let didRes = await this.generateDid(studentId)
                    console.log("didRes 75", didRes[0])
                    if (didRes) {
                        iterator.id = didRes[0].verificationMethod[0].controller
                        let updateRes = await this.sbrcUpdate({ did: iterator.id }, 'StudentDetail', studentDetails[0].osid)
                        console.log("updateRes", updateRes)
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

                }
            } else {
                console.log("else 100")
                let didRes = await this.generateDid(studentId)

                if (didRes) {
                    iterator.id = didRes[0].verificationMethod[0].controller
                }

                let inviteSchema = {
                    "did": iterator.id,
                    "dob": iterator.dob,
                    "meripehchanLoginId": "",
                    "aadhaarID": iterator.aadhaarId,
                    "studentName": iterator.studentName,
                    "schoolName": "",
                    "studentSchoolID": iterator.studentId,
                    "phoneNo": iterator.mobile.toString(),
                    "grade": "",
                    "username": ""
                }
                let sb_rc_response_text = await this.sbrcInvite(inviteSchema, 'StudentDetail')
                console.log("registerStudent", sb_rc_response_text)
                if (sb_rc_response_text?.error) {
                    console.log("err 122", sb_rc_response_text.error)
                } else if (
                    sb_rc_response_text?.params?.status === 'SUCCESSFUL'
                ) {
                    console.log("successfull")
                } else {
                    console.log("err 128", sb_rc_response_text)
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
        }

        //bulk import response
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

    async issueBulkCredential(credentialPlayload: BulkCredentialDto, schemaId: string, response: Response) {

        console.log('credentialPlayload: ', credentialPlayload);
        console.log('schemaId: ', schemaId);

        var issuerId = ''

        // find or create issuerId
        //find udise in rc
        let searchSchema = {
            "filters": {
                "udiseCode": {
                    "eq": credentialPlayload.issuerDetail.udise
                }
            }
        }
        let searchSchoolDetail = await this.sbrcSearch(searchSchema, 'SchoolDetail')
        console.log("searchSchoolDetail", searchSchoolDetail)

        if (searchSchoolDetail) {
            issuerId = searchSchoolDetail[0].did
            console.log("issuerId", issuerId)
        } else {
            let schoolDidRes = await this.generateDid(credentialPlayload.issuerDetail.udise)

            if (schoolDidRes) {
                credentialPlayload.issuerDetail.schoolDid = schoolDidRes[0].verificationMethod[0].controller
                //create schoolDetail in rc

                let inviteSchema = {
                    "schoolName": credentialPlayload.issuerDetail.schoolName,
                    "udiseCode": credentialPlayload.issuerDetail.udise,
                    "did": credentialPlayload.issuerDetail.schoolDid
                }
                let createSchoolDetail = await this.sbrcInvite(inviteSchema, 'SchoolDetail')
                console.log("createSchoolDetail", createSchoolDetail)
                if (createSchoolDetail) {
                    issuerId = credentialPlayload.issuerDetail.schoolDid
                    console.log("issuerId", issuerId)

                } else {
                    return response.status(200).send({
                        success: false,
                        status: 'Success',
                        message: 'Unable to create schoolDetail',
                        result: null
                    })
                }
            } else {
                return response.status(200).send({
                    success: false,
                    status: 'Success',
                    message: 'Unable to generate schoolDid',
                    result: null
                })
            }


        }


        //generate schema
        var schemaRes = await this.generateSchema(schemaId);
        console.log("schemaRes", schemaRes)

        if (schemaRes) {

            var responseArray = []

            // bulk import
            for (const iterator of credentialPlayload.credentialSubject) {

                if(credentialPlayload.credentialSubjectCommon.grade) {
                    iterator.grade = credentialPlayload.credentialSubjectCommon.grade;
                }
                if(credentialPlayload.credentialSubjectCommon.academicYear) {
                    iterator.academicYear = credentialPlayload.credentialSubjectCommon.academicYear;
                }
                if(credentialPlayload.credentialSubjectCommon.benefitProvider) {
                    iterator.benefitProvider = credentialPlayload.credentialSubjectCommon.benefitProvider
                }
                if(credentialPlayload.credentialSubjectCommon.schemeName) {
                    iterator.schemeName = credentialPlayload.credentialSubjectCommon.schemeName
                }
                if(credentialPlayload.credentialSubjectCommon.schemeId) {
                    iterator.schemeId = credentialPlayload.credentialSubjectCommon.schemeId
                }
                if(credentialPlayload.credentialSubjectCommon.assessment) {
                    iterator.assessment = credentialPlayload.credentialSubjectCommon.assessment
                }
                if(credentialPlayload.credentialSubjectCommon.quarterlyAssessment) {
                    iterator.quarterlyAssessment = credentialPlayload.credentialSubjectCommon.quarterlyAssessment
                }
                if(credentialPlayload.credentialSubjectCommon.total) {
                    iterator.total = credentialPlayload.credentialSubjectCommon.total
                }
                if(credentialPlayload.credentialSubjectCommon.schoolName) {
                    iterator.schoolName = credentialPlayload.credentialSubjectCommon.schoolName
                }

                //generate did or find did
                var aadhar_token = iterator.aadhar_token

                // find student
                let name = iterator.studentName
                let dob = iterator.dob
                let searchSchema = {
                    student_name: {
                        eq: name,
                    },
                    dob: {
                        eq: dob,
                    },
                }
                const studentDetails = await this.sbrcSearch(searchSchema, 'StudentV2')
                console.log("studentDetails", studentDetails)
                if (studentDetails.length > 0) {
                    if (studentDetails[0]?.DID) {
                        iterator.id = studentDetails[0].DID
                        let obj = {
                            issuerId: issuerId,
                            credSchema: schemaRes,
                            credentialSubject: iterator,
                            issuanceDate: credentialPlayload.vcData.issuanceDate,
                            expirationDate: credentialPlayload.vcData.expirationDate
                        }
                        console.log("obj", obj)

                        const cred = await this.issueCredentials(obj)
                        //console.log("cred 34", cred)
                        if (cred) {
                            responseArray.push(cred)
                        } else {
                            responseArray.push({ error: "unable to issue credentials!" })
                        }

                    } else {
                        let didRes = await this.generateDid(aadhar_token)

                        if (didRes) {
                            iterator.id = didRes[0].verificationMethod[0].controller
                            let updateRes = await this.sbrcUpdate({ DID: iterator.id }, 'StudentV2', studentDetails[0].osid)
                            if (updateRes) {
                                let obj = {
                                    issuerId: issuerId,
                                    credSchema: schemaRes,
                                    credentialSubject: iterator,
                                    issuanceDate: credentialPlayload.vcData.issuanceDate,
                                    expirationDate: credentialPlayload.vcData.expirationDate
                                }
                                console.log("obj", obj)

                                if (iterator.id) {

                                    const cred = await this.issueCredentials(obj)
                                    //console.log("cred 34", cred)
                                    if (cred) {
                                        responseArray.push(cred)
                                    } else {
                                        responseArray.push({ error: "unable to issue credentials!" })
                                    }
                                }
                            } else {
                                responseArray.push({ error: "unable to update did inside RC!" })
                            }
                        } else {
                            responseArray.push({ error: "unable to generate student did!" })
                        }
                    }
                } else {
                    let didRes = await this.generateDid(aadhar_token)

                    if (didRes) {
                        iterator.id = didRes[0].verificationMethod[0].controller
                        let inviteSchema = {
                            "DID": iterator.id,
                            "dob": iterator.dob,
                            "student_name": iterator.studentName
                        }
                        let createStudent = await this.sbrcInvite(inviteSchema, 'StudentV2')
                        console.log("createStudent", createStudent)
                        if(createStudent) {
                            let obj = {
                                issuerId: issuerId,
                                credSchema: schemaRes,
                                credentialSubject: iterator,
                                issuanceDate: credentialPlayload.vcData.issuanceDate,
                                expirationDate: credentialPlayload.vcData.expirationDate
                            }
                            console.log("obj", obj)

                            const cred = await this.issueCredentials(obj)
                            //console.log("cred 34", cred)
                            if (cred) {
                                responseArray.push(cred)
                            } else {
                                responseArray.push({ error: "unable to issue credentials!" })
                            }
                        } else {
                            responseArray.push({ error: "unable to create student in RC!" })
                        }
                        
                    } else {
                        responseArray.push({ error: "unable to generate student did!" })
                    }

                }
            }

            //bulk import response
            console.log("responseArray.length", responseArray.length)
            if (responseArray.length > 0) {
                return response.status(200).send({
                    success: true,
                    status: 'Success',
                    message: 'Bulk upload result!',
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

        } else {
            return response.status(200).send({
                success: false,
                status: 'Success',
                message: 'Unable to create schema',
                result: null
            })
        }


    }

    async issueSingleCredential(credentialPlayload: SingleCredentialDto, schemaId: string, response: Response) {
        console.log('credentialPlayload: ', credentialPlayload);
        console.log('schemaId: ', schemaId);

        var payload = credentialPlayload


        //var issuerId = "did:ulp:f08f7782-0d09-4c47-aacb-9092113bc33e"
        var issuerId = credentialPlayload.issuer;
        console.log("issuerId", issuerId)

        //generate schema
        console.log("schemaId", schemaId)

        var schemaRes = await this.generateSchema(schemaId);

        console.log("schemaRes", schemaRes)

        let studentId = payload.credentialSubject.studentId;
        console.log("studentId", studentId)
        const didRes = await this.generateDid(studentId);
        console.log("didRes 191", didRes)


        if (didRes) {
            var did = didRes[0].verificationMethod[0].controller
            payload.credentialSubject.id = did

            //update did inside sbrc
            let osid = payload.credentialSubject.osid;
            //const updateRes = await this.updateStudentDetails(osid, did);


            let updateRes = await this.sbrcUpdate({ did: did }, 'StudentDetail', osid)
            console.log("updateRes 199", updateRes)

            if (updateRes) {
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

    //v2

    async issueSingleCredentialv2(credentialPlayload: SingleCredentialDto, schemaId: string, response: Response) {
        console.log('credentialPlayload: ', credentialPlayload);
        console.log('schemaId: ', schemaId);

        var payload = credentialPlayload


        //var issuerId = "did:ulp:f08f7782-0d09-4c47-aacb-9092113bc33e"
        var issuerId = credentialPlayload.issuer;
        console.log("issuerId", issuerId)

        //generate schema
        console.log("schemaId", schemaId)

        var schemaRes = await this.generateSchema(schemaId);

        console.log("schemaRes", schemaRes)

        let studentId = payload.credentialSubject.studentId;
        console.log("studentId", studentId)
        const didRes = await this.generateDid(studentId);
        console.log("didRes 191", didRes)


        if (didRes) {
            var did = didRes[0].verificationMethod[0].controller
            payload.credentialSubject.id = did
            let obj = {
                issuerId: issuerId,
                credSchema: schemaRes,
                credentialSubject: payload.credentialSubject
            }
            console.log("obj", obj)
            const cred = await this.issueCredentials(obj)
            if (cred) {
                //update did inside sbrc
                var osid = payload.credentialSubject.osid;
                var student_id = payload.credentialSubject.studentId;

                let updateStudentDetail = await this.sbrcUpdate({ "claim_status": "approved" }, 'StudentDetailV2', osid)
                console.log("updateStudentDetail", updateStudentDetail)

                let updateStudent = await this.sbrcUpdate({ DID: did }, 'StudentV2', student_id)
                console.log("updateStudent", updateStudent)

                if (updateStudentDetail && updateStudent) {
                    console.log("updated in 1st attempt")
                    return response.status(200).send({
                        success: true,
                        status: 'Success',
                        message: 'Credentials generated successfully!',
                        result: cred
                    })
                } else {
                    // return response.status(200).send({
                    //     success: false,
                    //     status: 'Success',
                    //     message: 'Credentials generated successfully but Unable to update data inside Registry',
                    //     result: null
                    // })
                    console.log("updated in 2nd attempt")
                    let updateStudentDetail = await this.sbrcUpdate({ "claim_status": "approved" }, 'StudentDetailV2', osid)
                    console.log("updateStudentDetail", updateStudentDetail)

                    let updateStudent = await this.sbrcUpdate({ DID: did }, 'StudentV2', student_id)
                    console.log("updateStudent", updateStudent)

                    if (updateStudentDetail && updateStudent) {
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
                            message: 'Credentials generated successfully but Unable to update data inside Registry',
                            result: null
                        })
                    }
                }

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
                message: 'Unable to generate did',
                result: null
            })
        }
    }

    async rejectStudentV2(credentialPlayload: SingleCredentialDto, response: Response) {
        console.log("rejectStudentV2")
        var payload = credentialPlayload
        var osid = payload.credentialSubject.osid;
        let updateRes = await this.sbrcUpdate({ "claim_status": "rejected" }, 'StudentDetailV2', osid)
        console.log("updateRes 313", updateRes)
        if (updateRes) {
            return response.status(200).send({
                success: true,
                status: 'Success',
                message: 'Student rejected successfully!',
                result: null
            })
        } else {
            return response.status(200).send({
                success: false,
                status: 'Success',
                message: 'Unable to reject student',
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
            console.log("response did", response.data)
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
                "issuanceDate": payload.issuanceDate,
                "expirationDate": payload.expirationDate,
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

    async findStudentDid(studentId) {

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
        } catch (err) {
            console.log("update api err", err)
        }


    }

    //register Student
    async sbrcInvite1(studentData, entityName) {

        let inviteSchema = {
            "did": studentData.id,
            "dob": studentData.dob,
            "meripehchanLoginId": "",
            "aadhaarID": studentData.aadhaarId,
            "studentName": studentData.studentName,
            "schoolName": "",
            "studentSchoolID": studentData.studentId,
            "phoneNo": studentData.mobile,
            "grade": "",
            "username": ""
        }

        let data = JSON.stringify(inviteSchema);

        let config_sb_rc = {
            method: 'post',
            url: process.env.REGISTRY_URL + 'api/v1/' + entityName + '/invite',
            headers: {
                'content-type': 'application/json',
            },
            data: data,
        };

        try {
            const response = await axios(config_sb_rc)
            return response.data;
        } catch (err) {
            console.log("sbrcInvite err")
        }

    }

    async sbrcInvite(inviteSchema, entityName) {
        let data = JSON.stringify(inviteSchema);

        let config = {
            method: 'post',
            url: process.env.REGISTRY_URL + 'api/v1/' + entityName + '/invite',
            headers: {
                'content-type': 'application/json',
            },
            data: data,
        };

        try {
            const response = await axios(config);
            return response.data;
        } catch (err) {
            console.log("sb_rc_create err")
        }
    }

    async sbrcSearch(searchSchema, entityName) {
        let data = JSON.stringify(searchSchema);

        let config = {
            method: 'post',
            //url: process.env.REGISTRY_URL + 'api/v1/StudentV2/search',
            url: process.env.REGISTRY_URL + 'api/v1/' + entityName + '/search',
            headers: {
                'Content-Type': 'application/json',
            },
            data: data,
        };
        try {
            const response = await axios(config);
            return response.data;
        } catch (err) {
            console.log("sb_rc_search err")
        }

    }

    //search student
    async sbrcStudentSearch(studentName: string, dob: string) {
        let data = JSON.stringify({
            filters: {
                student_name: {
                    eq: studentName,
                },
                dob: {
                    eq: dob,
                },
            },
        });

        let config = {
            method: 'post',
            url: process.env.REGISTRY_URL + 'api/v1/StudentDetail/search',
            headers: {
                'Content-Type': 'application/json',
            },
            data: data,
        };
        try {
            const response = await axios(config);
            return response.data;
        } catch (err) {
            console.log("sb_rc_search err")
        }

    }



    //update
    async sbrcUpdate(updateSchema, entityName, osid) {
        console.log("updateSchema", updateSchema)
        console.log("entityName", entityName)
        console.log("osid", osid)
        let data = JSON.stringify(updateSchema);

        let config = {
            method: 'put',
            url: process.env.REGISTRY_URL + 'api/v1/' + entityName + '/' + osid,
            headers: {
                'content-type': 'application/json',
            },
            data: data,
        };

        try {
            const response = await axios(config);
            return response.data;
        } catch (err) {
            console.log("sb_rc_search err")
        }
    }

    //find schoolDetail in rc
    async searchSchoolDetail(udise) {
        let data = JSON.stringify({
            "filters": {
                "udiseCode": {
                    "eq": udise
                }
            }
        });

        let config = {
            method: 'post',
            maxBodyLength: Infinity,
            url: 'https://ulp.uniteframework.io/registry/api/v1/SchoolDetail/search',
            headers: {
                'Content-Type': 'application/json'
            },
            data: data
        };

        try {
            const response = await axios(config);
            return response.data;
        } catch (err) {
            console.log("sb_rc_search err")
        }


    }

    // create schoolDetail
    async createSchoolDetail(payload) {
        const axios = require('axios');
        let data = JSON.stringify({
            "schoolName": payload.schoolName,
            "udiseCode": payload.udise,
            "schoolCategory": 0,
            "schoolManagementCenter": 0,
            "schoolManagementState": 0,
            "schoolType": 0,
            "classFrom": 0,
            "classTo": 0,
            "stateCode": 0,
            "stateName": "",
            "districtName": "",
            "blockName": "",
            "locationType": 0,
            "headOfSchoolMobile": "",
            "respondentMobile": "",
            "alternateMobile": "",
            "schoolEmail": "",
            "did": payload.did
        });

        let config = {
            method: 'post',
            maxBodyLength: Infinity,
            url: 'https://ulp.uniteframework.io/registry/api/v1/SchoolDetail/invite',
            headers: {
                'Content-Type': 'application/json'
            },
            data: data
        };

        try {
            const response = await axios(config);
            return response.data;
        } catch (err) {
            console.log("sb_rc_create err")
        }

    }


}