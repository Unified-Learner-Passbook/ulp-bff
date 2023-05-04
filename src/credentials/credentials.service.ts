//import { HttpService } from '@nestjs/axios';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import axios from 'axios';
import { it } from 'node:test';
import { SingleCredentialDto } from './dto/singlecred-dto';
import { BulkCredentialDto } from './dto/bulkCred-dto';
import { Response } from 'express';
import { CredService } from 'src/services/cred/cred.service';
import { SbrcService } from 'src/services/sbrc/sbrc.service';

@Injectable()
export class CredentialsService {
  constructor(
    private credService: CredService,
    private sbrcService: SbrcService,
  ) {}

  async issueBulkCredential(
    credentialPlayload: BulkCredentialDto,
    schemaId: string,
    response: Response,
  ) {
    console.log('credentialPlayload: ', credentialPlayload);
    console.log('schemaId: ', schemaId);

    var issuerId = '';

    // find or create issuerId
    //find udise in rc
    let searchSchema = {
      filters: {
        udiseCode: {
          eq: credentialPlayload.issuerDetail.udise,
        },
      },
    };
    //let searchSchoolDetail = await this.sbrcSearch(searchSchema, 'SchoolDetail')
    let searchSchoolDetail = await this.sbrcService.sbrcSearch(
      searchSchema,
      'SchoolDetail',
    );
    console.log('searchSchoolDetail', searchSchoolDetail);

    if (searchSchoolDetail.length > 0) {
      issuerId = searchSchoolDetail[0].did;
      console.log('issuerId', issuerId);
    } else {
      //let schoolDidRes = await this.generateDid(credentialPlayload.issuerDetail.udise)
      let schoolDidRes = await this.credService.generateDid(
        credentialPlayload.issuerDetail.udise,
      );
      console.log('schoolDidRes', schoolDidRes);

      if (schoolDidRes) {
        credentialPlayload.issuerDetail.schoolDid =
          schoolDidRes[0].verificationMethod[0].controller;
        //create schoolDetail in rc

        let inviteSchema = {
          schoolName: credentialPlayload.issuerDetail.schoolName,
          udiseCode: credentialPlayload.issuerDetail.udise,
          did: credentialPlayload.issuerDetail.schoolDid,
        };
        //let createSchoolDetail = await this.sbrcInvite(inviteSchema, 'SchoolDetail')
        let createSchoolDetail = await this.sbrcService.sbrcInvite(
          inviteSchema,
          'SchoolDetail',
        );
        console.log('createSchoolDetail', createSchoolDetail);

        if (createSchoolDetail) {
          issuerId = credentialPlayload.issuerDetail.schoolDid;
          console.log('issuerId', issuerId);
        } else {
          return response.status(200).send({
            success: false,
            status: 'sb_rc_register_error',
            message: 'System Register Error ! Please try again.',
            result: null,
          });
        }
      } else {
        return response.status(200).send({
          success: false,
          status: 'did_generate_error',
          message: 'Identity Generation Failed ! Please Try Again.',
          result: null,
        });
      }
    }

    //generate schema
    //var schemaRes = await this.generateSchema(schemaId);
    var schemaRes = await this.credService.generateSchema(schemaId);
    console.log('schemaRes', schemaRes);

    if (schemaRes) {
      var responseArray = [];

      // bulk import
      for (const iterator of credentialPlayload.credentialSubject) {
        if (credentialPlayload.credentialSubjectCommon.grade) {
          iterator.grade = credentialPlayload.credentialSubjectCommon.grade;
        }
        if (credentialPlayload.credentialSubjectCommon.academic_year) {
          iterator.academic_year =
            credentialPlayload.credentialSubjectCommon.academic_year;
        }
        if (credentialPlayload.credentialSubjectCommon.benefitProvider) {
          iterator.benefitProvider =
            credentialPlayload.credentialSubjectCommon.benefitProvider;
        }
        if (credentialPlayload.credentialSubjectCommon.schemeName) {
          iterator.schemeName =
            credentialPlayload.credentialSubjectCommon.schemeName;
        }
        if (credentialPlayload.credentialSubjectCommon.schemeId) {
          iterator.schemeId =
            credentialPlayload.credentialSubjectCommon.schemeId;
        }
        if (credentialPlayload.credentialSubjectCommon.assessment) {
          iterator.assessment =
            credentialPlayload.credentialSubjectCommon.assessment;
        }
        if (credentialPlayload.credentialSubjectCommon.quarterlyAssessment) {
          iterator.quarterlyAssessment =
            credentialPlayload.credentialSubjectCommon.quarterlyAssessment;
        }
        if (credentialPlayload.credentialSubjectCommon.total) {
          iterator.total = credentialPlayload.credentialSubjectCommon.total;
        }
        if (credentialPlayload.issuerDetail.schoolName) {
          iterator.school_name = credentialPlayload.issuerDetail.schoolName;
        }
        if (credentialPlayload.issuerDetail.udise) {
          iterator.school_id = credentialPlayload.issuerDetail.udise;
        }

        //generate did or find did
        var aadhar_token = iterator.aadhar_token;

        // find student
        let name = iterator.student_name;
        let dob = iterator.dob;
        let searchSchema = {
          filters: {
            student_name: {
              eq: name,
            },
            dob: {
              eq: dob,
            },
          },
        };
        //const studentDetails = await this.sbrcSearch(searchSchema, 'StudentV2')
        const studentDetails = await this.sbrcService.sbrcSearch(
          searchSchema,
          'StudentV2',
        );
        console.log('studentDetails', studentDetails);

        if (studentDetails.length > 0) {
          if (studentDetails[0]?.DID) {
            iterator.id = studentDetails[0].DID;
            let obj = {
              issuerId: issuerId,
              credSchema: schemaRes,
              credentialSubject: iterator,
              issuanceDate: credentialPlayload.vcData.issuanceDate,
              expirationDate: credentialPlayload.vcData.expirationDate,
            };
            console.log('obj', obj);

            //const cred = await this.issueCredentials(obj)
            const cred = await this.credService.issueCredentials(obj);
            //console.log("cred 34", cred)
            if (cred) {
              responseArray.push(cred);
            } else {
              responseArray.push({
                student_name: iterator.student_name,
                dob: iterator.dob,
                error: 'unable to issue credentials!',
              });
            }
          } else {
            //let didRes = await this.generateDid(aadhar_token)
            let didRes = await this.credService.generateDid(aadhar_token);

            if (didRes) {
              iterator.id = didRes[0].verificationMethod[0].controller;
              //let updateRes = await this.sbrcUpdate({ DID: iterator.id }, 'StudentV2', studentDetails[0].osid)
              let updateRes = await this.sbrcService.sbrcUpdate(
                { DID: iterator.id },
                'StudentV2',
                studentDetails[0].osid,
              );
              if (updateRes) {
                let obj = {
                  issuerId: issuerId,
                  credSchema: schemaRes,
                  credentialSubject: iterator,
                  issuanceDate: credentialPlayload.vcData.issuanceDate,
                  expirationDate: credentialPlayload.vcData.expirationDate,
                };
                console.log('obj', obj);

                if (iterator.id) {
                  //const cred = await this.issueCredentials(obj)
                  const cred = await this.credService.issueCredentials(obj);
                  //console.log("cred 34", cred)
                  if (cred) {
                    responseArray.push(cred);
                  } else {
                    responseArray.push({
                      student_name: iterator.student_name,
                      dob: iterator.dob,
                      error: 'unable to issue credentials!',
                    });
                  }
                }
              } else {
                responseArray.push({
                  student_name: iterator.student_name,
                  dob: iterator.dob,
                  error: 'unable to update did inside RC!',
                });
              }
            } else {
              responseArray.push({
                student_name: iterator.student_name,
                dob: iterator.dob,
                error: 'unable to generate student did!',
              });
            }
          }
        } else {
          //let didRes = await this.generateDid(aadhar_token)
          console.log('aadhar_token  205', aadhar_token);
          if (aadhar_token) {
            let didRes = await this.credService.generateDid(aadhar_token);

            if (didRes) {
              iterator.id = didRes[0].verificationMethod[0].controller;
              let inviteSchema = {
                student_id: iterator.student_id,
                DID: iterator.id,
                reference_id: iterator.reference_id,
                aadhar_token: iterator.aadhar_token,
                student_name: iterator.student_name,
                dob: iterator.dob,
                school_type: 'public',
                meripehchan_id: '',
                username: (
                  iterator.student_name.split(' ')[0] +
                  '@' +
                  iterator.dob.split('/').join('')
                ).toLowerCase(),
              };
              console.log('inviteSchema', inviteSchema);
              //let createStudent = await this.sbrcInvite(inviteSchema, 'StudentV2')
              let createStudent = await this.sbrcService.sbrcInvite(
                inviteSchema,
                'StudentV2',
              );
              console.log('createStudent', createStudent);

              if (createStudent) {
                let obj = {
                  issuerId: issuerId,
                  credSchema: schemaRes,
                  credentialSubject: iterator,
                  issuanceDate: credentialPlayload.vcData.issuanceDate,
                  expirationDate: credentialPlayload.vcData.expirationDate,
                };
                console.log('obj', obj);

                //const cred = await this.issueCredentials(obj)
                const cred = await this.credService.issueCredentials(obj);
                //console.log("cred 34", cred)
                if (cred) {
                  responseArray.push(cred);
                } else {
                  responseArray.push({
                    student_name: iterator.student_name,
                    dob: iterator.dob,
                    error: 'unable to issue credentials!',
                  });
                }
              } else {
                responseArray.push({
                  student_name: iterator.student_name,
                  dob: iterator.dob,
                  error: 'unable to create student in RC!',
                });
              }
            } else {
              responseArray.push({
                student_name: iterator.student_name,
                dob: iterator.dob,
                error: 'unable to generate student did!',
              });
            }
          } else {
            responseArray.push({
              student_name: iterator.student_name,
              dob: iterator.dob,
              error: 'aadhar_token not found!',
            });
          }
        }
      }

      //bulk import response
      console.log('responseArray.length', responseArray.length);
      if (responseArray.length > 0) {
        return response.status(200).send({
          success: true,
          status: 'student_cred_bulk_api_success',
          message: 'Student Cred Bulk API Success.',
          result: responseArray,
        });
      } else {
        return response.status(200).send({
          success: false,
          status: 'did_cred_generate_error',
          message:
            'User Identity and Credentials Generation Failed. Try Again.',
          result: null,
        });
      }
    } else {
      return response.status(200).send({
        success: false,
        status: 'did_cred_generate_error',
        message: 'User Identity and Credentials Generation Failed. Try Again.',
        result: null,
      });
    }
  }

  async getSchema(id: string, response: Response) {
    console.log('id: 172', id);
    //const schemaRes = await this.generateSchema(id);
    const schemaRes = await this.credService.generateSchema(id);

    console.log('schemaRes', schemaRes);

    if (schemaRes) {
      return response.status(200).send({
        success: true,
        status: 'cred_schema_api_success',
        message: 'Cred Schema API Success',
        result: schemaRes,
      });
    } else {
      return response.status(200).send({
        success: false,
        status: 'cred_schema_api_failed',
        message: 'Credentials Schema Failed ! Please Try Again.',
        result: null,
      });
    }
  }

  async issueSingleCredential(
    credentialPlayload: SingleCredentialDto,
    schemaId: string,
    response: Response,
  ) {
    console.log('credentialPlayload: ', credentialPlayload);
    console.log('schemaId: ', schemaId);

    var payload = credentialPlayload;

    var osid = payload.credentialSubject.osid;
    var student_osid = payload.credentialSubject.student_osid;

    //var issuerId = "did:ulp:f08f7782-0d09-4c47-aacb-9092113bc33e"
    var issuerId = credentialPlayload.issuer;
    console.log('issuerId', issuerId);

    //generate schema
    console.log('schemaId', schemaId);

    //const schemaRes = await this.generateSchema(schemaId);
    const schemaRes = await this.credService.generateSchema(schemaId);

    console.log('schemaRes', schemaRes);

    if (schemaRes) {
      let aadhar_token = payload.credentialSubject.aadhar_token;
      console.log('aadhar_token', aadhar_token);
      //const didRes = await this.generateDid(aadhar_token);
      const didRes = await this.credService.generateDid(aadhar_token);
      console.log('didRes 191', didRes);

      if (!didRes?.error) {
        var did = didRes[0].verificationMethod[0].controller;
        payload.credentialSubject.id = did;
        delete payload.credentialSubject.osid;
        delete payload.credentialSubject.student_osid;
        //fix for enroll on 4 may
        let enrolled_on = payload.credentialSubject.enrollon;
        delete payload.credentialSubject.enrollon;
        payload.credentialSubject.enrolled_on = enrolled_on;

        let obj = {
          issuerId: issuerId,
          credSchema: schemaRes,
          credentialSubject: payload.credentialSubject,
          issuanceDate: payload.vcData.issuanceDate,
          expirationDate: payload.vcData.expirationDate,
        };
        //console.log('obj', obj);
        //const cred = await this.issueCredentials(obj)
        //const cred = await this.credService.issueCredentials(obj)
        //if (cred) {
        //update did inside sbrc

        //let updateStudentDetail = await this.sbrcUpdate({ "claim_status": "issued" }, 'StudentDetailV2', osid)
        let updateStudentDetail = await this.sbrcService.sbrcUpdateEL(
          { claim_status: 'issued' },
          'StudentDetailV2',
          osid,
        );
        if (updateStudentDetail?.error) {
          return response.status(400).send({
            success: false,
            status: 'sb_rc_update_error',
            message: 'System Update Error ! Please try again.',
            result: updateStudentDetail?.error,
          });
        }
        //console.log('updateStudentDetail', updateStudentDetail);
        else {
          //let updateStudent = await this.sbrcUpdate({ DID: did }, 'StudentV2', student_osid)
          let updateStudent = await this.sbrcService.sbrcUpdateEL(
            { DID: did },
            'StudentV2',
            student_osid,
          );
          //console.log('updateStudent', updateStudent);

          if (updateStudent?.error) {
            return response.status(400).send({
              success: false,
              status: 'sb_rc_update_error',
              message: 'System Update Error ! Please try again.',
              result: updateStudent?.error,
            });
          } else {
            const cred = await this.credService.issueCredentials(obj);

            if (cred) {
              return response.status(200).send({
                success: true,
                status: 'Success',
                message: 'Credentials generated successfully!',
                result: cred,
              });
            } else {
              return response.status(200).send({
                success: false,
                status: 'cred_issue_api_success',
                message: 'Cred Issue API Success',
                result: null,
              });
            }
          }
        }
        // } else {
        //     return response.status(200).send({
        //         success: false,
        //         status: 'cred_issue_api_success',
        //         message: 'Cred Issue API Success',
        //         result: null
        //     })
        // }
      } else {
        return response.status(200).send({
          success: false,
          status: 'did_generate_error',
          message: 'Identity Generation Failed ! Please Try Again.',
          result: null,
        });
      }
    } else {
      return response.status(200).send({
        success: false,
        status: 'did_cred_generate_error',
        message: 'User Identity and Credentials Generation Failed. Try Again.',
        result: null,
      });
    }
  }

  async rejectStudent(
    credentialPlayload: SingleCredentialDto,
    response: Response,
  ) {
    console.log('rejectStudentV2');
    var payload = credentialPlayload;
    var osid = payload.credentialSubject.osid;
    //let updateRes = await this.sbrcUpdate({ "claim_status": "rejected" }, 'StudentDetailV2', osid)
    let updateRes = await this.sbrcService.sbrcUpdate(
      { claim_status: 'rejected' },
      'StudentDetailV2',
      osid,
    );
    console.log('updateRes 313', updateRes);
    if (updateRes) {
      return response.status(200).send({
        success: true,
        status: 'sb_rc_update_success',
        message: 'System Update Success',
        result: null,
      });
    } else {
      return response.status(200).send({
        success: false,
        status: 'sb_rc_update_error',
        message: 'System Update Error ! Please try again.',
        result: null,
      });
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
