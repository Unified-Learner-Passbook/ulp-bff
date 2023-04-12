//import { HttpService } from '@nestjs/axios';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import axios from 'axios';
import { it } from 'node:test';
import { CredentialDto } from './dto/credential-dto';
import { SingleCredentialDto } from './dto/singlecred-dto';
import { BulkCredentialDto } from './dto/bulkCred-dto';
import { Response } from 'express';
import { CredService } from 'src/services/cred/cred.service';
import { SbrcService } from 'src/services/sbrc/sbrc.service';

@Injectable()
export class CredentialsService {

    constructor(private credService: CredService, private sbrcService : SbrcService) { }

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
        //let searchSchoolDetail = await this.sbrcSearch(searchSchema, 'SchoolDetail')
        let searchSchoolDetail = await this.sbrcService.sbrcSearch(searchSchema, 'SchoolDetail')
        console.log("searchSchoolDetail", searchSchoolDetail)


        if (searchSchoolDetail.length>0) {
            issuerId = searchSchoolDetail[0].did
            console.log("issuerId", issuerId)
        } else {
            //let schoolDidRes = await this.generateDid(credentialPlayload.issuerDetail.udise)
            let schoolDidRes = await this.credService.generateDid(credentialPlayload.issuerDetail.udise)
            console.log("schoolDidRes", schoolDidRes)

            if (schoolDidRes) {
                credentialPlayload.issuerDetail.schoolDid = schoolDidRes[0].verificationMethod[0].controller
                //create schoolDetail in rc

                let inviteSchema = {
                    "schoolName": credentialPlayload.issuerDetail.schoolName,
                    "udiseCode": credentialPlayload.issuerDetail.udise,
                    "did": credentialPlayload.issuerDetail.schoolDid
                }
                //let createSchoolDetail = await this.sbrcInvite(inviteSchema, 'SchoolDetail')
                let createSchoolDetail = await this.sbrcService.sbrcInvite(inviteSchema, 'SchoolDetail')
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
        //var schemaRes = await this.generateSchema(schemaId);
        var schemaRes = await this.credService.generateSchema(schemaId);
        console.log("schemaRes", schemaRes)

        if (schemaRes) {

            var responseArray = []

            // bulk import
            for (const iterator of credentialPlayload.credentialSubject) {

                if (credentialPlayload.credentialSubjectCommon.grade) {
                    iterator.grade = credentialPlayload.credentialSubjectCommon.grade;
                }
                if (credentialPlayload.credentialSubjectCommon.academic_year) {
                    iterator.academic_year = credentialPlayload.credentialSubjectCommon.academic_year;
                }
                if (credentialPlayload.credentialSubjectCommon.benefitProvider) {
                    iterator.benefitProvider = credentialPlayload.credentialSubjectCommon.benefitProvider
                }
                if (credentialPlayload.credentialSubjectCommon.schemeName) {
                    iterator.schemeName = credentialPlayload.credentialSubjectCommon.schemeName
                }
                if (credentialPlayload.credentialSubjectCommon.schemeId) {
                    iterator.schemeId = credentialPlayload.credentialSubjectCommon.schemeId
                }
                if (credentialPlayload.credentialSubjectCommon.assessment) {
                    iterator.assessment = credentialPlayload.credentialSubjectCommon.assessment
                }
                if (credentialPlayload.credentialSubjectCommon.quarterlyAssessment) {
                    iterator.quarterlyAssessment = credentialPlayload.credentialSubjectCommon.quarterlyAssessment
                }
                if (credentialPlayload.credentialSubjectCommon.total) {
                    iterator.total = credentialPlayload.credentialSubjectCommon.total
                }
                if (credentialPlayload.issuerDetail.schoolName) {
                    iterator.school_name = credentialPlayload.issuerDetail.schoolName
                }
                if (credentialPlayload.issuerDetail.udise) {
                    iterator.school_id = credentialPlayload.issuerDetail.udise
                }

                //generate did or find did
                var aadhar_token = iterator.aadhar_token

                // find student
                let name = iterator.student_name
                let dob = iterator.dob
                let searchSchema = {
                    "filters": {
                        "student_name": {
                            "eq": name
                        },
                        "dob": {
                            "eq": dob
                        }
                    }
                }
                //const studentDetails = await this.sbrcSearch(searchSchema, 'StudentV2')
                const studentDetails = await this.sbrcService.sbrcSearch(searchSchema, 'StudentV2')
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

                        //const cred = await this.issueCredentials(obj)
                        const cred = await this.credService.issueCredentials(obj)
                        //console.log("cred 34", cred)
                        if (cred) {
                            responseArray.push(cred)
                        } else {
                            responseArray.push({ error: "unable to issue credentials!" })
                        }

                    } else {
                        //let didRes = await this.generateDid(aadhar_token)
                        let didRes = await this.credService.generateDid(aadhar_token)

                        if (didRes) {
                            iterator.id = didRes[0].verificationMethod[0].controller
                            //let updateRes = await this.sbrcUpdate({ DID: iterator.id }, 'StudentV2', studentDetails[0].osid)
                            let updateRes = await this.sbrcService.sbrcUpdate({ DID: iterator.id }, 'StudentV2', studentDetails[0].osid)
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

                                    //const cred = await this.issueCredentials(obj)
                                    const cred = await this.credService.issueCredentials(obj)
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
                    //let didRes = await this.generateDid(aadhar_token)
                    let didRes = await this.credService.generateDid(aadhar_token)

                    if (didRes) {
                        iterator.id = didRes[0].verificationMethod[0].controller
                        let inviteSchema = {
                            "student_id": iterator.student_id,
                            "DID": iterator.id,
                            "reference_id": iterator.reference_id,
                            "aadhar_token": iterator.aadhar_token,
                            "student_name": iterator.student_name,
                            "dob": iterator.dob,
                            "school_type": "public",
                            "meripehchan_id": "",
                            "username": (iterator.student_name.split(' ')[0]+'@'+iterator.dob.split('/').join('')).toLowerCase()
                        }
                        console.log("inviteSchema", inviteSchema)
                        //let createStudent = await this.sbrcInvite(inviteSchema, 'StudentV2')
                        let createStudent = await this.sbrcService.sbrcInvite(inviteSchema, 'StudentV2')
                        console.log("createStudent", createStudent)

                        if (createStudent) {
                            let obj = {
                                issuerId: issuerId,
                                credSchema: schemaRes,
                                credentialSubject: iterator,
                                issuanceDate: credentialPlayload.vcData.issuanceDate,
                                expirationDate: credentialPlayload.vcData.expirationDate
                            }
                            console.log("obj", obj)

                            //const cred = await this.issueCredentials(obj)
                            const cred = await this.credService.issueCredentials(obj)
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

    async getSchema(id: string, response: Response) {

        console.log('id: 172', id);
        //const schemaRes = await this.generateSchema(id);
        const schemaRes = await this.credService.generateSchema(id);

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

    async issueSingleCredential(credentialPlayload: SingleCredentialDto, schemaId: string, response: Response) {
        console.log('credentialPlayload: ', credentialPlayload);
        console.log('schemaId: ', schemaId);

        var payload = credentialPlayload

        var osid = payload.credentialSubject.osid;
        var student_osid = payload.credentialSubject.student_osid;


        //var issuerId = "did:ulp:f08f7782-0d09-4c47-aacb-9092113bc33e"
        var issuerId = credentialPlayload.issuer;
        console.log("issuerId", issuerId)

        //generate schema
        console.log("schemaId", schemaId)

        //const schemaRes = await this.generateSchema(schemaId);
        const schemaRes = await this.credService.generateSchema(schemaId);

        console.log("schemaRes", schemaRes)

        if (schemaRes) {

            let aadhar_token = payload.credentialSubject.aadhar_token;
            console.log("aadhar_token", aadhar_token)
            //const didRes = await this.generateDid(aadhar_token);
            const didRes = await this.credService.generateDid(aadhar_token);
            console.log("didRes 191", didRes)

            if (didRes) {
                var did = didRes[0].verificationMethod[0].controller
                payload.credentialSubject.id = did
                delete payload.credentialSubject.osid
                delete payload.credentialSubject.student_osid
                let obj = {
                    issuerId: issuerId,
                    credSchema: schemaRes,
                    credentialSubject: payload.credentialSubject,
                    "issuanceDate": "2023-02-06T11:56:27.259Z",
                    "expirationDate": "2023-02-06T11:56:27.259Z"
                }
                console.log("obj", obj)
                //const cred = await this.issueCredentials(obj)
                const cred = await this.credService.issueCredentials(obj)
                if (cred) {
                    //update did inside sbrc

                    //let updateStudentDetail = await this.sbrcUpdate({ "claim_status": "issued" }, 'StudentDetailV2', osid)
                    let updateStudentDetail = await this.sbrcService.sbrcUpdate({ "claim_status": "issued" }, 'StudentDetailV2', osid)
                    console.log("updateStudentDetail", updateStudentDetail)

                    //let updateStudent = await this.sbrcUpdate({ DID: did }, 'StudentV2', student_osid)
                    let updateStudent = await this.sbrcService.sbrcUpdate({ DID: did }, 'StudentV2', student_osid)
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
                            result: cred
                        })
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

        } else {
            return response.status(200).send({
                success: false,
                status: 'Success',
                message: 'Unable to create schema',
                result: null
            })
        }


    }

    async rejectStudent(credentialPlayload: SingleCredentialDto, response: Response) {
        console.log("rejectStudentV2")
        var payload = credentialPlayload
        var osid = payload.credentialSubject.osid;
        //let updateRes = await this.sbrcUpdate({ "claim_status": "rejected" }, 'StudentDetailV2', osid)
        let updateRes = await this.sbrcService.sbrcUpdate({ "claim_status": "rejected" }, 'StudentDetailV2', osid)
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


    // //helper function

    // // credentials
    // // generate schema
    // async generateSchema(schemaId) {
    //     var config = {
    //         method: 'get',
    //         maxBodyLength: Infinity,
    //         url: `${process.env.SCHEMA_URL}/schema/jsonld?id=${schemaId}`,
    //         headers: {}
    //     };

    //     try {
    //         const response = await axios(config)
    //         console.log("response schema", response.data)
    //         return response.data;
    //     } catch (error) {
    //         console.log("error schema", error)
    //     }
    // }

    // //generate did
    // async generateDid(studentId) {
    //     var data = JSON.stringify({
    //         "content": [
    //             {
    //                 "alsoKnownAs": [
    //                     `did.${studentId}`
    //                 ],
    //                 "services": [
    //                     {
    //                         "id": "IdentityHub",
    //                         "type": "IdentityHub",
    //                         "serviceEndpoint": {
    //                             "@context": "schema.identity.foundation/hub",
    //                             "@type": "UserServiceEndpoint",
    //                             "instance": [
    //                                 "did:test:hub.id"
    //                             ]
    //                         }
    //                     }
    //                 ]
    //             }
    //         ]
    //     });

    //     var config = {
    //         method: 'post',
    //         maxBodyLength: Infinity,
    //         url: `${process.env.DID_URL}/did/generate`,
    //         headers: {
    //             'Content-Type': 'application/json'
    //         },
    //         data: data
    //     };

    //     try {
    //         const response = await axios(config)
    //         console.log("response did", response.data)
    //         return response.data;
    //     } catch (error) {
    //         console.log("did error", error.message)
    //     }
    // }

    // //issue cred
    // async issueCredentials(payload) {

    //     var data = JSON.stringify({
    //         "credential": {
    //             "@context": [
    //                 "https://www.w3.org/2018/credentials/v1",
    //                 "https://www.w3.org/2018/credentials/examples/v1"
    //             ],
    //             "id": "did:ulp:b4a191af-d86e-453c-9d0e-dd4771067235",
    //             "type": [
    //                 "VerifiableCredential",
    //                 "UniversityDegreeCredential"
    //             ],
    //             "issuer": `${payload.issuerId}`,
    //             "issuanceDate": payload.issuanceDate,
    //             "expirationDate": payload.expirationDate,
    //             "credentialSubject": payload.credentialSubject,
    //             "options": {
    //                 "created": "2020-04-02T18:48:36Z",
    //                 "credentialStatus": {
    //                     "type": "RevocationList2020Status"
    //                 }
    //             }
    //         },
    //         "credentialSchemaId": payload.credSchema.id,
    //         "tags": [
    //             "tag1",
    //             "tag2",
    //             "tag3"
    //         ]
    //     });

    //     var config = {
    //         method: 'post',
    //         maxBodyLength: Infinity,
    //         url: 'http://64.227.185.154:3002/credentials/issue',
    //         headers: {
    //             'Content-Type': 'application/json'
    //         },
    //         data: data
    //     };

    //     try {

    //         const response = await axios(config)
    //         console.log("cred response")
    //         return response.data;

    //     } catch (e) {
    //         console.log("cred error", e.message)
    //     }

    // }

    // // sbrc
    // //invite
    // async sbrcInvite(inviteSchema, entityName) {
    //     let data = JSON.stringify(inviteSchema);

    //     let config = {
    //         method: 'post',
    //         url: process.env.REGISTRY_URL + 'api/v1/' + entityName + '/invite',
    //         headers: {
    //             'content-type': 'application/json',
    //         },
    //         data: data,
    //     };

    //     try {
    //         const response = await axios(config);
    //         return response.data;
    //     } catch (err) {
    //         console.log("sb_rc_create err")
    //     }
    // }

    // //search
    // async sbrcSearch(searchSchema, entityName) {
    //     let data = JSON.stringify(searchSchema);

    //     let config = {
    //         method: 'post',
    //         //url: process.env.REGISTRY_URL + 'api/v1/StudentV2/search',
    //         url: process.env.REGISTRY_URL + 'api/v1/' + entityName + '/search',
    //         headers: {
    //             'Content-Type': 'application/json',
    //         },
    //         data: data,
    //     };
    //     try {
    //         const response = await axios(config);
    //         return response.data;
    //     } catch (err) {
    //         console.log("sb_rc_search err")
    //     }

    // }

    // //update
    // async sbrcUpdate(updateSchema, entityName, osid) {
    //     console.log("updateSchema", updateSchema)
    //     console.log("entityName", entityName)
    //     console.log("osid", osid)
    //     let data = JSON.stringify(updateSchema);

    //     let config = {
    //         method: 'put',
    //         url: process.env.REGISTRY_URL + 'api/v1/' + entityName + '/' + osid,
    //         headers: {
    //             'content-type': 'application/json',
    //         },
    //         data: data,
    //     };

    //     try {
    //         const response = await axios(config);
    //         return response.data;
    //     } catch (err) {
    //         console.log("sb_rc_update err")
    //     }
    // }


}