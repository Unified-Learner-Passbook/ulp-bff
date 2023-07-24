import { Injectable, StreamableFile } from '@nestjs/common';

import { HttpService } from '@nestjs/axios';
import { AxiosRequestConfig } from 'axios';

//custom imports
import { Response, Request } from 'express';
import { BulkCredentialDto } from './dto/bulkCred-dto';
import { SbrcService } from '../services/sbrc/sbrc.service';
import { CredService } from 'src/services/cred/cred.service';
import { AadharService } from '../services/aadhar/aadhar.service';
import { UsersService } from 'src/services/users/users.service';

const cred_url = process.env.CRED_URL || 'http://64.227.185.154:3002';
const did_url = process.env.DID_URL || 'http://64.227.185.154:3000';
const schema_url = process.env.SCHEMA_URL || 'http://64.227.185.154:3001';

@Injectable()
export class ClientService {
  constructor(
    private readonly httpService: HttpService,
    private sbrcService: SbrcService,
    private credService: CredService,
    private aadharService: AadharService,
    private usersService: UsersService,
  ) {}
  //axios call
  md5 = require('md5');
  crypto = require('crypto');
  fs = require('fs');
  x509 = require('x509.js');
  convert = require('json-to-plain-text');
  forge = require('node-forge');

  //registerClient
  async registerClient(requestbody: any, response: Response) {
    if (requestbody?.clientName) {
      //search in sb rc
      const filter = {
        filters: {
          clientName: {
            eq: requestbody?.clientName,
          },
        },
      };
      const sb_rc_search_detail = await this.sbrcService.sbrcSearchEL(
        'Client',
        filter,
      );
      //console.log(sb_rc_search_detail);
      if (sb_rc_search_detail?.error) {
        return response.status(501).send({
          success: false,
          status: 'sb_rc_search_error',
          message: 'System Search Error ! Please try again.',
          result: sb_rc_search_detail?.error,
        });
      } else if (sb_rc_search_detail.length === 0) {
        // no client found then register
        requestbody.clientId = await this.getClientId(requestbody?.clientName);
        requestbody.clientSecret = await this.getClientSecret(
          requestbody?.clientName,
        );
        // sunbird registery client
        let sb_rc_response_text = await this.sbrcService.sbrcInviteEL(
          requestbody,
          'Client',
        );
        if (sb_rc_response_text?.error) {
          return response.status(400).send({
            success: false,
            status: 'sb_rc_register_error',
            message: 'System Register Error ! Please try again.',
            result: sb_rc_response_text?.error,
          });
        } else if (sb_rc_response_text?.params?.status === 'SUCCESSFUL') {
          return response.status(200).send({
            success: true,
            status: 'sb_rc_registred',
            message: 'System Register Success.',
            result: null,
          });
        } else {
          return response.status(400).send({
            success: false,
            status: 'sb_rc_register_duplicate',
            message: 'Duplicate Data Found.',
            result: sb_rc_response_text,
          });
        }
      } else {
        return response.status(200).send({
          success: true,
          status: 'sb_rc_search_found',
          message: 'Data Found in System.',
          result: null,
        });
      }
    } else {
      return response.status(400).send({
        success: false,
        status: 'invalid_request',
        message: 'Invalid Request. Not received All Parameters.',
        result: null,
      });
    }
  }
  //searchClient
  async searchClient(clientName: string, response: Response) {
    if (clientName) {
      //search in sb rc//find if student private detaile
      const filter = {
        filters: {
          clientName: {
            eq: clientName,
          },
        },
      };
      const sb_rc_search_detail = await this.sbrcService.sbrcSearchEL(
        'Client',
        filter,
      );
      //console.log(sb_rc_search_detail);
      if (sb_rc_search_detail?.error) {
        return response.status(501).send({
          success: false,
          status: 'sb_rc_search_error',
          message: 'System Search Error ! Please try again.',
          result: sb_rc_search_detail?.error,
        });
      } else if (sb_rc_search_detail.length === 0) {
        // no client found then register
        return response.status(501).send({
          success: false,
          status: 'sb_rc_search_no_found',
          message: 'Data Not Found in System.',
          result: sb_rc_search_detail,
        });
      } else {
        return response.status(200).send({
          success: true,
          status: 'sb_rc_search_found',
          message: 'Data Found in System.',
          result: sb_rc_search_detail,
        });
      }
    } else {
      return response.status(400).send({
        success: false,
        status: 'invalid_request',
        message: 'Invalid Request. Not received All Parameters.',
        result: null,
      });
    }
  }
  //bulkRegister
  async bulkRegister(
    clientId: string,
    clientSecret: string,
    credentialPlayload: BulkCredentialDto,
    schemaId: string,
    response: Response,
  ) {
    if (clientId && clientSecret) {
      //search in sb rc//find if student private detaile
      const filter = {
        filters: {
          clientId: {
            eq: clientId,
          },
          clientSecret: {
            eq: clientSecret,
          },
        },
      };
      const sb_rc_search_detail = await this.sbrcService.sbrcSearchEL(
        'Client',
        filter,
      );
      //console.log(sb_rc_search_detail);
      if (sb_rc_search_detail?.error) {
        return response.status(501).send({
          success: false,
          status: 'sb_rc_search_error',
          message: 'System Search Error ! Please try again.',
          result: sb_rc_search_detail?.error,
        });
      } else if (sb_rc_search_detail.length === 0) {
        // no client found then register
        return response.status(501).send({
          success: false,
          status: 'sb_rc_invalid_credentials',
          message: 'Invalid Client ID and Client Secret',
          result: sb_rc_search_detail,
        });
      } else {
        //register bulk student

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
        let searchSchoolDetail = await this.sbrcService.sbrcSearch(
          searchSchema,
          'SchoolDetail',
        );
        console.log('searchSchoolDetail', searchSchoolDetail);

        if (searchSchoolDetail.length > 0) {
          issuerId = searchSchoolDetail[0].did;
          console.log('issuerId', issuerId);
        } else {
          let schoolDidRes = await this.credService.generateDid(
            credentialPlayload.issuerDetail.udise,
          );

          if (schoolDidRes) {
            credentialPlayload.issuerDetail.schoolDid =
              schoolDidRes[0].verificationMethod[0].controller;
            //create schoolDetail in rc

            let inviteSchema = {
              schoolName: credentialPlayload.issuerDetail.schoolName,
              udiseCode: credentialPlayload.issuerDetail.udise,
              did: credentialPlayload.issuerDetail.schoolDid,
            };
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
        var schemaRes = await this.credService.generateSchema(schemaId);
        console.log('schemaRes', schemaRes);

        if (schemaRes) {
          //error log report
          let iserror = false;
          let loglist = [];
          let error_count = 0;
          let success_count = 0;
          let i_count = 0;

          var responseArray = [];

          // bulk import
          for (const iterator of credentialPlayload.credentialSubject) {
            loglist[i_count] = {};
            loglist[i_count].studentDetails = iterator;

            try {
              if (credentialPlayload.credentialSubjectCommon.grade) {
                iterator.grade =
                  credentialPlayload.credentialSubjectCommon.grade;
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
              if (
                credentialPlayload.credentialSubjectCommon.quarterlyAssessment
              ) {
                iterator.quarterlyAssessment =
                  credentialPlayload.credentialSubjectCommon.quarterlyAssessment;
              }
              if (credentialPlayload.credentialSubjectCommon.total) {
                iterator.total =
                  credentialPlayload.credentialSubjectCommon.total;
              }
              //list of schema update fields
              if (credentialPlayload.issuerDetail.schoolName) {
                iterator.school_name =
                  credentialPlayload.issuerDetail.schoolName;
              }
              if (credentialPlayload.issuerDetail.udise) {
                iterator.school_id = credentialPlayload.issuerDetail.udise;
              }
              if (credentialPlayload.credentialSubjectCommon.stateCode) {
                iterator.stateCode =
                  credentialPlayload.credentialSubjectCommon.stateCode;
              }
              if (credentialPlayload.credentialSubjectCommon.stateName) {
                iterator.stateName =
                  credentialPlayload.credentialSubjectCommon.stateName;
              }
              if (credentialPlayload.credentialSubjectCommon.districtCode) {
                iterator.districtCode =
                  credentialPlayload.credentialSubjectCommon.districtCode;
              }
              if (credentialPlayload.credentialSubjectCommon.districtName) {
                iterator.districtName =
                  credentialPlayload.credentialSubjectCommon.districtName;
              }
              if (credentialPlayload.credentialSubjectCommon.blockCode) {
                iterator.blockCode =
                  credentialPlayload.credentialSubjectCommon.blockCode;
              }
              if (credentialPlayload.credentialSubjectCommon.blockName) {
                iterator.blockName =
                  credentialPlayload.credentialSubjectCommon.blockName;
              }

              //generate did or find did
              var aadhar_token = iterator.aadhar_token;

              // find student
              let name = iterator.student_name;
              let dob = iterator.dob;
              let searchSchema = {
                filters: {
                  /*student_name: {
                  eq: name,
                },
                dob: {
                  eq: dob,
                },*/
                  aadhar_token: {
                    eq: aadhar_token,
                  },
                },
              };
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

                  const cred = await this.credService.issueCredentials(obj);
                  //console.log("cred 34", cred)
                  if (cred) {
                    responseArray.push(cred);
                    loglist[i_count].status = true;
                    loglist[i_count].error = {};
                    success_count++;
                  } else {
                    responseArray.push({
                      error: 'unable to issue credentials!',
                    });
                    iserror = true;
                    loglist[i_count].status = false;
                    loglist[i_count].error =
                      'Unable to Issue Credentials ! Please Try Again.';
                    //loglist[i_count].errorlog = {};
                    error_count++;
                  }
                } else {
                  let didRes = await this.credService.generateDid(aadhar_token);

                  if (didRes) {
                    iterator.id = didRes[0].verificationMethod[0].controller;
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
                        expirationDate:
                          credentialPlayload.vcData.expirationDate,
                      };
                      console.log('obj', obj);

                      if (iterator.id) {
                        const cred = await this.credService.issueCredentials(
                          obj,
                        );
                        //console.log("cred 34", cred)
                        if (cred) {
                          responseArray.push(cred);
                          loglist[i_count].status = true;
                          loglist[i_count].error = {};
                          success_count++;
                        } else {
                          responseArray.push({
                            error: 'unable to issue credentials!',
                          });
                          iserror = true;
                          loglist[i_count].status = false;
                          loglist[i_count].error =
                            'Unable to Issue Credentials ! Please Try Again.';
                          //loglist[i_count].errorlog = {};
                          error_count++;
                        }
                      }
                    } else {
                      responseArray.push({
                        error: 'unable to update did inside RC!',
                      });
                      iserror = true;
                      loglist[i_count].status = false;
                      loglist[i_count].error =
                        'Unable to Update Student Identity ! Please Try Again.';
                      //loglist[i_count].errorlog = {};
                      error_count++;
                    }
                  } else {
                    responseArray.push({
                      error: 'unable to generate student did!',
                    });
                    iserror = true;
                    loglist[i_count].status = false;
                    loglist[i_count].error =
                      'Unable to Generate Student DID ! Please Try Again.';
                    //loglist[i_count].errorlog = {};
                    error_count++;
                  }
                }
              } else {
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
                    //"username": (iterator.student_name.split(' ')[0]+'@'+iterator.dob.split('/').join('')).toLowerCase()
                    username: iterator.aadhar_token,
                    aadhaar_status: 'verified',
                    aadhaar_enc: '',
                    gender: iterator?.gender ? iterator.gender : '',
                    school_udise: iterator.school_id,
                    school_name: iterator.school_name,
                    stateCode: iterator.stateCode,
                    stateName: iterator.stateName,
                    districtCode: iterator.districtCode,
                    districtName: iterator.districtName,
                    blockCode: iterator.blockCode,
                    blockName: iterator.blockName,
                  };
                  console.log('inviteSchema', inviteSchema);
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

                    const cred = await this.credService.issueCredentials(obj);
                    //console.log("cred 34", cred)
                    if (cred) {
                      responseArray.push(cred);
                      loglist[i_count].status = true;
                      loglist[i_count].error = {};
                      success_count++;
                    } else {
                      responseArray.push({
                        error: 'unable to issue credentials!',
                      });
                      iserror = true;
                      loglist[i_count].status = false;
                      loglist[i_count].error =
                        'Unable to Issue Credentials ! Please Try Again.';
                      //loglist[i_count].errorlog = {};
                      error_count++;
                    }
                  } else {
                    responseArray.push({
                      error: 'unable to create student in RC!',
                    });
                    iserror = true;
                    loglist[i_count].status = false;
                    loglist[i_count].error =
                      'Unable to Create Student Account ! Please Try Again.';
                    //loglist[i_count].errorlog = {};
                    error_count++;
                  }
                } else {
                  responseArray.push({
                    error: 'unable to generate student did!',
                  });
                  iserror = true;
                  loglist[i_count].status = false;
                  loglist[i_count].error =
                    'Unable to Generate Student DID ! Please Try Again.';
                  //loglist[i_count].errorlog = {};
                  error_count++;
                }
              }
            } catch (e) {
              console.log(e);
              iserror = true;
              loglist[i_count].status = false;
              loglist[i_count].error = 'System Exception ! Please Try Again.';
              loglist[i_count].errorlog = JSON.stringify(e);
              error_count++;
            }
            i_count++;
          }

          //bulk import response
          //console.log('responseArray.length', responseArray.length);
          /*if (responseArray.length > 0) {
            return response.status(200).send({
              success: true,
              status: 'student_cred_bulk_api_success',
              message: 'Student Cred Bulk API Success',
              result: responseArray,
            });
          } else {
            return response.status(200).send({
              success: false,
              status: 'did_cred_generate_error',
              message: 'User Identity and Credentials Generation Failed. Try Again.',
              result: null,
            });
          }*/

          return response.status(200).send({
            success: true,
            status: 'student_bulk_upload_api_success',
            iserror: iserror,
            message: 'Student Bulk Upload API Success.',
            error_count: error_count,
            success_count: success_count,
            result: loglist,
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
      }
    } else {
      return response.status(400).send({
        success: false,
        status: 'invalid_request',
        message: 'Invalid Request. Not received All Parameters.',
        result: null,
      });
    }
  }

  // 21 june q2 new apis
  //getDID
  async getDID(
    clientId: string,
    clientSecret: string,
    uniquetext: string,
    response: Response,
  ) {
    if (clientId && clientSecret) {
      //search in sb rc//find if student private detaile
      const filter = {
        filters: {
          clientId: {
            eq: clientId,
          },
          clientSecret: {
            eq: clientSecret,
          },
        },
      };
      const sb_rc_search_detail = await this.sbrcService.sbrcSearchEL(
        'Client',
        filter,
      );
      //console.log(sb_rc_search_detail);
      if (sb_rc_search_detail?.error) {
        return response.status(501).send({
          success: false,
          status: 'sb_rc_search_error',
          message: 'System Search Error ! Please try again.',
          result: sb_rc_search_detail?.error,
        });
      } else if (sb_rc_search_detail.length === 0) {
        // no client found then register
        return response.status(501).send({
          success: false,
          status: 'sb_rc_invalid_credentials',
          message: 'Invalid Client ID and Client Secret',
          result: sb_rc_search_detail,
        });
      } else {
        if (uniquetext) {
          const generateddid = await this.credService.generateDid(uniquetext);
          if (generateddid?.error) {
            return response.status(400).send({
              success: false,
              status: 'did_generate_error',
              message: 'Identity Generation Failed ! Please Try Again.',
              result: generateddid?.error,
            });
          } else {
            var did = generateddid[0].verificationMethod[0].controller;
            return response.status(200).send({
              success: true,
              status: 'did_success',
              message: 'DID Success',
              result: did,
            });
          }
        }
      }
    } else {
      return response.status(400).send({
        success: false,
        status: 'invalid_request',
        message: 'Invalid Request. Not received All Parameters.',
        result: null,
      });
    }
  }

  //getIssuerRegister
  async getIssuerRegister(
    clientId: string,
    clientSecret: string,
    name: string,
    did: string,
    response: Response,
  ) {
    if (clientId && clientSecret) {
      //search in sb rc//find if student private detaile
      const filter = {
        filters: {
          clientId: {
            eq: clientId,
          },
          clientSecret: {
            eq: clientSecret,
          },
        },
      };
      const sb_rc_search_detail = await this.sbrcService.sbrcSearchEL(
        'Client',
        filter,
      );
      //console.log(sb_rc_search_detail);
      if (sb_rc_search_detail?.error) {
        return response.status(501).send({
          success: false,
          status: 'sb_rc_search_error',
          message: 'System Search Error ! Please try again.',
          result: sb_rc_search_detail?.error,
        });
      } else if (sb_rc_search_detail.length === 0) {
        // no client found then register
        return response.status(501).send({
          success: false,
          status: 'sb_rc_invalid_credentials',
          message: 'Invalid Client ID and Client Secret',
          result: sb_rc_search_detail,
        });
      } else {
        //register invite
        let data = JSON.stringify({
          name: name,
          did: did,
        });
        const url = process.env.REGISTRY_URL + 'api/v1/Issuer/invite';
        const config: AxiosRequestConfig = {
          headers: {
            'content-type': 'application/json',
          },
        };
        var sb_rc_response_text = null;
        try {
          const observable = this.httpService.post(url, data, config);
          const promise = observable.toPromise();
          const response = await promise;
          //console.log(JSON.stringify(response.data));
          sb_rc_response_text = response.data;
        } catch (e) {
          //console.log(e);
          sb_rc_response_text = { error: e };
        }
        if (sb_rc_response_text?.error) {
          return response.status(400).send({
            success: false,
            status: 'sb_rc_register_error',
            message: 'System Register Error ! Please try again.',
            result: sb_rc_response_text?.error,
          });
        } else if (sb_rc_response_text?.params?.status === 'SUCCESSFUL') {
          return response.status(200).send({
            success: true,
            status: 'issuer_register',
            message: 'Issuer Registered',
            result: sb_rc_response_text,
          });
        } else {
          return response.status(400).send({
            success: false,
            status: 'sb_rc_register_duplicate',
            message: 'Duplicate Data Found.',
            result: sb_rc_response_text,
          });
        }
      }
    } else {
      return response.status(400).send({
        success: false,
        status: 'invalid_request',
        message: 'Invalid Request. Not received All Parameters.',
        result: null,
      });
    }
  }

  //getAadhaarToken
  async getAadhaarToken(
    response: Response,
    aadhaar_id: string,
    aadhaar_name: string,
    aadhaar_dob: string,
    aadhaar_gender: string,
  ) {
    if (aadhaar_id && aadhaar_name && aadhaar_dob && aadhaar_gender) {
      const aadhar_data = await this.aadharService.aadhaarDemographic(
        aadhaar_id,
        aadhaar_name,
        aadhaar_dob,
        aadhaar_gender,
      );

      //console.log(aadhar_data);
      if (!aadhar_data?.success === true) {
        return response.status(400).send({
          success: false,
          status: 'aadhaar_api_error',
          message: 'Aadhar API Not Working',
          result: aadhar_data?.result,
        });
      } else {
        if (aadhar_data?.result?.ret === 'y') {
          const decodedxml = aadhar_data?.decodedxml;
          const uuid = await this.aadharService.getUUID(decodedxml);
          if (uuid === null) {
            return response.status(400).send({
              success: false,
              status: 'aadhaar_api_uuid_error',
              message: 'Aadhar API UUID Not Found',
              result: uuid,
            });
          } else {
            return response.status(200).send({
              success: true,
              status: 'aadhaar_api_success',
              message: 'Aadhar API Working',
              result: uuid,
            });
          }
        } else {
          return response.status(200).send({
            success: false,
            status: 'invalid_aadhaar',
            message: 'Invalid Aadhaar',
            result: null,
          });
        }
      }
    } else {
      return response.status(400).send({
        success: false,
        status: 'invalid_request',
        message: 'Invalid Request. Not received All Parameters.',
        result: null,
      });
    }
  }

  //bulkRegisterV2
  async bulkRegisterV2(
    clientId: string,
    clientSecret: string,
    credentialPlayload: BulkCredentialDto,
    schemaId: string,
    response: Response,
  ) {
    if (clientId && clientSecret) {
      //search in sb rc//find if student private detaile
      const filter = {
        filters: {
          clientId: {
            eq: clientId,
          },
          clientSecret: {
            eq: clientSecret,
          },
        },
      };
      const sb_rc_search_detail = await this.sbrcService.sbrcSearchEL(
        'Client',
        filter,
      );
      //console.log(sb_rc_search_detail);
      if (sb_rc_search_detail?.error) {
        return response.status(501).send({
          success: false,
          status: 'sb_rc_search_error',
          message: 'System Search Error ! Please try again.',
          result: sb_rc_search_detail?.error,
        });
      } else if (sb_rc_search_detail.length === 0) {
        // no client found then register
        return response.status(501).send({
          success: false,
          status: 'sb_rc_invalid_credentials',
          message: 'Invalid Client ID and Client Secret',
          result: sb_rc_search_detail,
        });
      } else {
        //register bulk student

        console.log('credentialPlayload: ', credentialPlayload);
        console.log('schemaId: ', schemaId);

        var issuerId = credentialPlayload.issuerDetail.did;

        //generate schema
        var schemaRes = await this.credService.generateSchema(schemaId);
        console.log('schemaRes', schemaRes);

        if (schemaRes) {
          //error log report
          let iserror = false;
          let loglist = [];
          let error_count = 0;
          let success_count = 0;
          let i_count = 0;

          var responseArray = [];

          // bulk import
          for (const iterator of credentialPlayload.credentialSubject) {
            loglist[i_count] = {};
            loglist[i_count].studentDetails = iterator;

            try {
              if (credentialPlayload?.credentialSubjectCommon?.grade) {
                iterator.grade =
                  credentialPlayload.credentialSubjectCommon.grade;
              }
              if (credentialPlayload?.credentialSubjectCommon?.academic_year) {
                iterator.academic_year =
                  credentialPlayload.credentialSubjectCommon.academic_year;
              }
              if (
                credentialPlayload?.credentialSubjectCommon?.benefitProvider
              ) {
                iterator.benefitProvider =
                  credentialPlayload.credentialSubjectCommon.benefitProvider;
              }
              if (credentialPlayload?.credentialSubjectCommon?.schemeName) {
                iterator.schemeName =
                  credentialPlayload.credentialSubjectCommon.schemeName;
              }
              if (credentialPlayload?.credentialSubjectCommon?.schemeId) {
                iterator.schemeId =
                  credentialPlayload.credentialSubjectCommon.schemeId;
              }
              if (credentialPlayload?.credentialSubjectCommon?.assessment) {
                iterator.assessment =
                  credentialPlayload.credentialSubjectCommon.assessment;
              }
              if (
                credentialPlayload?.credentialSubjectCommon?.quarterlyAssessment
              ) {
                iterator.quarterlyAssessment =
                  credentialPlayload.credentialSubjectCommon.quarterlyAssessment;
              }
              if (credentialPlayload?.credentialSubjectCommon?.total) {
                iterator.total =
                  credentialPlayload.credentialSubjectCommon.total;
              }
              //list of schema update fields
              if (credentialPlayload.issuerDetail.schoolName) {
                iterator.school_name =
                  credentialPlayload.issuerDetail.schoolName;
              }
              if (credentialPlayload.issuerDetail.udise) {
                iterator.school_id = credentialPlayload.issuerDetail.udise;
              }
              if (credentialPlayload?.credentialSubjectCommon?.stateCode) {
                iterator.stateCode =
                  credentialPlayload.credentialSubjectCommon.stateCode;
              }
              if (credentialPlayload?.credentialSubjectCommon?.stateName) {
                iterator.stateName =
                  credentialPlayload.credentialSubjectCommon.stateName;
              }
              if (credentialPlayload?.credentialSubjectCommon?.districtCode) {
                iterator.districtCode =
                  credentialPlayload.credentialSubjectCommon.districtCode;
              }
              if (credentialPlayload?.credentialSubjectCommon?.districtName) {
                iterator.districtName =
                  credentialPlayload.credentialSubjectCommon.districtName;
              }
              if (credentialPlayload?.credentialSubjectCommon?.blockCode) {
                iterator.blockCode =
                  credentialPlayload.credentialSubjectCommon.blockCode;
              }
              if (credentialPlayload?.credentialSubjectCommon?.blockName) {
                iterator.blockName =
                  credentialPlayload.credentialSubjectCommon.blockName;
              }

              //generate did or find did
              var name = iterator.student_name;
              var dob = iterator.dob;
              var gender = iterator.gender;
              var aadhaar_token = iterator.aadhar_token;

              // find student
              let searchSchema = {
                filters: {
                  name: {
                    eq: name,
                  },
                  dob: {
                    eq: dob,
                  },
                  gender: {
                    eq: gender,
                  },
                },
              };
              const studentDetails = await this.sbrcService.sbrcSearch(
                searchSchema,
                'Learner',
              );
              console.log('Learner Details', studentDetails);
              if (studentDetails.length > 0) {
                if (studentDetails[0]?.did) {
                  iterator.id = studentDetails[0].did;
                  let obj = {
                    issuerId: issuerId,
                    credSchema: schemaRes,
                    credentialSubject: iterator,
                    issuanceDate: credentialPlayload.vcData.issuanceDate,
                    expirationDate: credentialPlayload.vcData.expirationDate,
                  };
                  console.log('obj', obj);

                  const cred = await this.credService.issueCredentials(obj);
                  //console.log("cred 34", cred)
                  if (cred) {
                    responseArray.push(cred);
                    loglist[i_count].status = true;
                    loglist[i_count].error = {};
                    success_count++;
                  } else {
                    responseArray.push({
                      error: 'unable to issue credentials!',
                    });
                    iserror = true;
                    loglist[i_count].status = false;
                    loglist[i_count].error =
                      'Unable to Issue Credentials ! Please Try Again.';
                    //loglist[i_count].errorlog = {};
                    error_count++;
                  }
                } else {
                  let didRes = await this.credService.generateDid(
                    aadhaar_token,
                  );

                  if (didRes) {
                    iterator.id = didRes[0].verificationMethod[0].controller;
                    let updateRes = await this.sbrcService.sbrcUpdate(
                      { did: iterator.id, aadhaar_token: aadhaar_token },
                      'Learner',
                      studentDetails[0].osid,
                    );
                    if (updateRes) {
                      let obj = {
                        issuerId: issuerId,
                        credSchema: schemaRes,
                        credentialSubject: iterator,
                        issuanceDate: credentialPlayload.vcData.issuanceDate,
                        expirationDate:
                          credentialPlayload.vcData.expirationDate,
                      };
                      console.log('obj', obj);

                      if (iterator.id) {
                        const cred = await this.credService.issueCredentials(
                          obj,
                        );
                        //console.log("cred 34", cred)
                        if (cred) {
                          responseArray.push(cred);
                          loglist[i_count].status = true;
                          loglist[i_count].error = {};
                          success_count++;
                        } else {
                          responseArray.push({
                            error: 'unable to issue credentials!',
                          });
                          iserror = true;
                          loglist[i_count].status = false;
                          loglist[i_count].error =
                            'Unable to Issue Credentials ! Please Try Again.';
                          //loglist[i_count].errorlog = {};
                          error_count++;
                        }
                      }
                    } else {
                      responseArray.push({
                        error: 'unable to update did inside RC!',
                      });
                      iserror = true;
                      loglist[i_count].status = false;
                      loglist[i_count].error =
                        'Unable to Update Student Identity ! Please Try Again.';
                      //loglist[i_count].errorlog = {};
                      error_count++;
                    }
                  } else {
                    responseArray.push({
                      error: 'unable to generate student did!',
                    });
                    iserror = true;
                    loglist[i_count].status = false;
                    loglist[i_count].error =
                      'Unable to Generate Student DID ! Please Try Again.';
                    //loglist[i_count].errorlog = {};
                    error_count++;
                  }
                }
              } else {
                let didRes = await this.credService.generateDid(aadhaar_token);

                if (didRes) {
                  iterator.id = didRes[0].verificationMethod[0].controller;
                  let inviteSchema = {
                    name: iterator.student_name,
                    dob: iterator.dob,
                    gender: iterator.gender,
                    did: iterator.id,
                    username: '',
                    aadhaar_token: iterator.aadhar_token,
                    kyc_aadhaar_token: '',
                    recoveryphone: '',
                  };
                  console.log('inviteSchema', inviteSchema);
                  let createStudent = await this.sbrcService.sbrcInvite(
                    inviteSchema,
                    'Learner',
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

                    const cred = await this.credService.issueCredentials(obj);
                    //console.log("cred 34", cred)
                    if (cred) {
                      responseArray.push(cred);
                      loglist[i_count].status = true;
                      loglist[i_count].error = {};
                      success_count++;
                    } else {
                      responseArray.push({
                        error: 'unable to issue credentials!',
                      });
                      iserror = true;
                      loglist[i_count].status = false;
                      loglist[i_count].error =
                        'Unable to Issue Credentials ! Please Try Again.';
                      //loglist[i_count].errorlog = {};
                      error_count++;
                    }
                  } else {
                    responseArray.push({
                      error: 'unable to create student in RC!',
                    });
                    iserror = true;
                    loglist[i_count].status = false;
                    loglist[i_count].error =
                      'Unable to Create Student Account ! Please Try Again.';
                    //loglist[i_count].errorlog = {};
                    error_count++;
                  }
                } else {
                  responseArray.push({
                    error: 'unable to generate student did!',
                  });
                  iserror = true;
                  loglist[i_count].status = false;
                  loglist[i_count].error =
                    'Unable to Generate Student DID ! Please Try Again.';
                  //loglist[i_count].errorlog = {};
                  error_count++;
                }
              }
            } catch (e) {
              console.log(e);
              iserror = true;
              loglist[i_count].status = false;
              loglist[i_count].error = 'System Exception ! Please Try Again.';
              loglist[i_count].errorlog = JSON.stringify(e);
              error_count++;
            }
            i_count++;
          }

          return response.status(200).send({
            success: true,
            status: 'student_bulk_upload_api_success',
            iserror: iserror,
            message: 'Student Bulk Upload API Success.',
            error_count: error_count,
            success_count: success_count,
            result: loglist,
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
      }
    } else {
      return response.status(400).send({
        success: false,
        status: 'invalid_request',
        message: 'Invalid Request. Not received All Parameters.',
        result: null,
      });
    }
  }

  //bulkGetData
  async bulkGetData(
    clientId: string,
    clientSecret: string,
    type: string,
    response: Response,
  ) {
    if (clientId && clientSecret) {
      //search in sb rc//find if student private detaile
      const filter = {
        filters: {
          clientId: {
            eq: clientId,
          },
          clientSecret: {
            eq: clientSecret,
          },
        },
      };
      const sb_rc_search_detail = await this.sbrcService.sbrcSearchEL(
        'Client',
        filter,
      );
      //console.log(sb_rc_search_detail);
      if (sb_rc_search_detail?.error) {
        return response.status(501).send({
          success: false,
          status: 'sb_rc_search_error',
          message: 'System Search Error ! Please try again.',
          result: sb_rc_search_detail?.error,
        });
      } else if (sb_rc_search_detail.length === 0) {
        // no client found then register
        return response.status(501).send({
          success: false,
          status: 'sb_rc_invalid_credentials',
          message: 'Invalid Client ID and Client Secret',
          result: sb_rc_search_detail,
        });
      } else {
        var credentialSubject = await this.credentialSubjectData(type);
        return response.status(200).send({
          success: true,
          status: 'data_return',
          message: 'Data Return',
          result: credentialSubject,
        });
      }
    } else {
      return response.status(400).send({
        success: false,
        status: 'invalid_request',
        message: 'Invalid Request. Not received All Parameters.',
        result: null,
      });
    }
  }

  //helper function
  //generate clientId
  async getClientId(clientName) {
    let length = 4;
    let chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    var result = '';
    for (var i = length; i > 0; --i)
      result += chars[Math.floor(Math.random() * chars.length)];
    let timestamp = Math.floor(Date.now() / 1000).toString();
    timestamp = timestamp.substr(timestamp.length - 5);
    result += timestamp;
    return result;
  }
  //generate clientSecret
  async getClientSecret(clientName) {
    let length = 10;
    let chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    var result = '';
    for (var i = length; i > 0; --i)
      result += chars[Math.floor(Math.random() * chars.length)];
    result += Math.floor(Date.now() / 1000).toString();
    return await this.md5(clientName + result);
  }

  async credentialSubjectData(type) {
    console.log('type', type);
    var users;
    var credSubject = [];
    if (type === 'proofOfAssessment') {
      users = await this.usersService.findAllAssesment();

      console.log('users', users);

      for (let iterator of users) {
        console.log('iterator 1124', iterator);
        iterator = JSON.parse(JSON.stringify(iterator));
        console.log('iterator 1126', iterator);
        let assesmentObj = {
          student_id: iterator?.Id,
          student_name: iterator?.name,
          dob: iterator?.age,
          gender: 'M',
          reference_id: iterator?.ref_id,
          aadhar_token: iterator?.aadhaar_id,
          marks: iterator?.marks,
          //common
          grade: 'class-1',
          academic_year: '2022-2023',
          assessment: iterator?.assesment_id,
          schoolName: 'CENTRAL PUBLIC ACEDEMY',
          total: '40',
          quarterlyAssessment: '3',
          stateCode: '09',
          stateName: 'Uttar Pradesh',
          districtCode: '0913',
          districtName: 'HATHRAS',
          blockCode: '091306',
          blockName: 'SADABAD',
        };
        credSubject.push(assesmentObj);
      }
    }
    if (type === 'proofOfEnrollment') {
      users = await this.usersService.findAllEnrollment();

      console.log('users', users);

      for (let iterator of users) {
        console.log('iterator 1124', iterator);
        iterator = JSON.parse(JSON.stringify(iterator));
        console.log('iterator 1126', iterator);
        let enrollmentObj = {
          student_name: iterator?.name,
          name: iterator?.name,
          dob: iterator?.dob,
          gender: iterator?.gender,
          aadhar_token: iterator?.aadhaar_id,
          orgName: iterator?.orgname,
          orgId: iterator?.orgid,
          orgAddress: iterator?.orgaddress,
          orgContact: iterator?.orgcontact,
          orgEmail: iterator?.orgemail,
          associatedSince: iterator?.associatedsince,
          contact: iterator?.contact,
          orgLogo: iterator?.orglogo,
          profileImage: iterator?.profileimage,
          associatedTill: iterator?.associatedtill,
          emergencyContact: iterator?.emergencycontact,
          unitAssociatedWith: iterator?.unitassociatedwith,
        };
        credSubject.push(enrollmentObj);
      }
    }
    if (type === 'proofOfBenifits') {
      users = await this.usersService.findAllBenefit();

      console.log('users', users);

      for (let iterator of users) {
        console.log('iterator 1124', iterator);
        iterator = JSON.parse(JSON.stringify(iterator));
        console.log('iterator 1126', iterator);
        let benefitObj = {
          student_id: iterator?.Id,
          student_name: iterator?.name,
          dob: '29/12/1990',
          gender: 'M',
          reference_id: iterator?.ref_id,
          aadhar_token: iterator?.aadhaar_id,
          guardian_name: 'Test Guardian ' + iterator?.name,
          enrolled_on: '2022-06-06',
          transactionId: iterator?.transaction_id,
          transactionAmount: iterator?.transaction_amount,
          deliveryDate: '01-07-2023',
          //common
          grade: 'class-1',
          academic_year: '2022-2023',
          benefitProvider: 'Basic Shiksha department',
          schemeName: iterator?.scheme_name,
          schemeId: iterator?.scheme_id,
          stateCode: '09',
          stateName: 'Uttar Pradesh',
          districtCode: '0913',
          districtName: 'HATHRAS',
          blockCode: '091306',
          blockName: 'SADABAD',
        };
        credSubject.push(benefitObj);
      }
    }
    console.log('credSubject', credSubject);
    return credSubject;
  }
}
