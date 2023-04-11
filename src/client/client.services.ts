import { Injectable, StreamableFile } from '@nestjs/common';

//custom imports
import axios from 'axios';
import { Response, Request } from 'express';
import { BulkCredentialDto } from './dto/bulkCred-dto';

const cred_url = process.env.CRED_URL || 'http://64.227.185.154:3002';
const did_url = process.env.DID_URL || 'http://64.227.185.154:3000';
const schema_url = process.env.SCHEMA_URL || 'http://64.227.185.154:3001';

@Injectable()
export class ClientService {
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
      const sb_rc_search_detail = await this.searchEntityNew('Client', filter);
      //console.log(sb_rc_search_detail);
      if (sb_rc_search_detail?.error) {
        return response.status(501).send({
          success: false,
          status: 'sb_rc_search_error',
          message: 'Sunbird Search Failed',
          result: sb_rc_search_detail?.error,
        });
      } else if (sb_rc_search_detail.length === 0) {
        // no client found then register
        requestbody.clientId = await this.getClientId(requestbody?.clientName);
        requestbody.clientSecret = await this.getClientSecret(
          requestbody?.clientName,
        );
        // sunbird registery client
        let sb_rc_response_text = await this.sbrcInviteNew(
          requestbody,
          'Client',
        );
        if (sb_rc_response_text?.error) {
          return response.status(400).send({
            success: false,
            status: 'sb_rc_register_error',
            message: 'Sunbird RC Registration Failed',
            result: sb_rc_response_text?.error,
          });
        } else if (sb_rc_response_text?.params?.status === 'SUCCESSFUL') {
          return response.status(200).send({
            success: true,
            status: 'sb_rc_registred',
            message: 'Client Registered in Subird RC',
            result: null,
          });
        } else {
          return response.status(400).send({
            success: false,
            status: 'sb_rc_register_duplicate',
            message: 'Client Already Registered in Sunbird RC',
            result: sb_rc_response_text,
          });
        }
      } else {
        return response.status(200).send({
          success: true,
          status: 'sb_rc_search_found',
          message: 'Client Already Found in Subird RC',
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
      const sb_rc_search_detail = await this.searchEntityNew('Client', filter);
      //console.log(sb_rc_search_detail);
      if (sb_rc_search_detail?.error) {
        return response.status(501).send({
          success: false,
          status: 'sb_rc_search_error',
          message: 'Sunbird Search Failed',
          result: sb_rc_search_detail?.error,
        });
      } else if (sb_rc_search_detail.length === 0) {
        // no client found then register
        return response.status(501).send({
          success: false,
          status: 'sb_rc_search_no_found',
          message: 'Sunbird Search No Found',
          result: sb_rc_search_detail,
        });
      } else {
        return response.status(200).send({
          success: true,
          status: 'sb_rc_search_found',
          message: 'Client Found in Subird RC',
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
      const sb_rc_search_detail = await this.searchEntityNew('Client', filter);
      //console.log(sb_rc_search_detail);
      if (sb_rc_search_detail?.error) {
        return response.status(501).send({
          success: false,
          status: 'sb_rc_search_error',
          message: 'Sunbird Search Failed',
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
        let searchSchoolDetail = await this.sbrcSearch(
          searchSchema,
          'SchoolDetail',
        );
        console.log('searchSchoolDetail', searchSchoolDetail);

        if (searchSchoolDetail.length > 0) {
          issuerId = searchSchoolDetail[0].did;
          console.log('issuerId', issuerId);
        } else {
          let schoolDidRes = await this.generateDid(
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
            let createSchoolDetail = await this.sbrcInvite(
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
                status: 'Success',
                message: 'Unable to create schoolDetail',
                result: null,
              });
            }
          } else {
            return response.status(200).send({
              success: false,
              status: 'Success',
              message: 'Unable to generate schoolDid',
              result: null,
            });
          }
        }

        //generate schema
        var schemaRes = await this.generateSchema(schemaId);
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
            if (
              credentialPlayload.credentialSubjectCommon.quarterlyAssessment
            ) {
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
            const studentDetails = await this.sbrcSearch(
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

                const cred = await this.issueCredentials(obj);
                //console.log("cred 34", cred)
                if (cred) {
                  responseArray.push(cred);
                } else {
                  responseArray.push({ error: 'unable to issue credentials!' });
                }
              } else {
                let didRes = await this.generateDid(aadhar_token);

                if (didRes) {
                  iterator.id = didRes[0].verificationMethod[0].controller;
                  let updateRes = await this.sbrcUpdate(
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
                      const cred = await this.issueCredentials(obj);
                      //console.log("cred 34", cred)
                      if (cred) {
                        responseArray.push(cred);
                      } else {
                        responseArray.push({
                          error: 'unable to issue credentials!',
                        });
                      }
                    }
                  } else {
                    responseArray.push({
                      error: 'unable to update did inside RC!',
                    });
                  }
                } else {
                  responseArray.push({
                    error: 'unable to generate student did!',
                  });
                }
              }
            } else {
              let didRes = await this.generateDid(aadhar_token);

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
                };
                console.log('inviteSchema', inviteSchema);
                let createStudent = await this.sbrcInvite(
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

                  const cred = await this.issueCredentials(obj);
                  //console.log("cred 34", cred)
                  if (cred) {
                    responseArray.push(cred);
                  } else {
                    responseArray.push({
                      error: 'unable to issue credentials!',
                    });
                  }
                } else {
                  responseArray.push({
                    error: 'unable to create student in RC!',
                  });
                }
              } else {
                responseArray.push({
                  error: 'unable to generate student did!',
                });
              }
            }
          }

          //bulk import response
          console.log('responseArray.length', responseArray.length);
          if (responseArray.length > 0) {
            return response.status(200).send({
              success: true,
              status: 'Success',
              message: 'Bulk upload result!',
              result: responseArray,
            });
          } else {
            return response.status(200).send({
              success: false,
              status: 'Success',
              message: 'Unable to generate did or crdentials',
              result: null,
            });
          }
        } else {
          return response.status(200).send({
            success: false,
            status: 'Success',
            message: 'Unable to create schema',
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

  // invite entity in registery
  async sbrcInviteNew(inviteSchema, entityName) {
    let data = JSON.stringify(inviteSchema);

    let config_sb_rc = {
      method: 'post',
      url: process.env.REGISTRY_URL + 'api/v1/' + entityName + '/invite',
      headers: {
        'content-type': 'application/json',
      },
      data: data,
    };

    var sb_rc_response_text = null;
    await axios(config_sb_rc)
      .then(function (response) {
        //console.log(JSON.stringify(response.data));
        sb_rc_response_text = response.data;
      })
      .catch(function (error) {
        //console.log(error);
        sb_rc_response_text = { error: error };
      });

    return sb_rc_response_text;
  }
  //searchEntity
  async searchEntityNew(entity: string, filter: any) {
    let data = JSON.stringify(filter);

    let url = process.env.REGISTRY_URL + 'api/v1/' + entity + '/search';
    //console.log(data + ' ' + url);
    let config = {
      method: 'post',
      url: url,
      headers: {
        'Content-Type': 'application/json',
      },
      data: data,
    };
    let sb_rc_search = null;
    await axios(config)
      .then(function (response) {
        //console.log(JSON.stringify(response.data));
        sb_rc_search = response.data;
      })
      .catch(function (error) {
        //console.log(error);
        sb_rc_search = { error: error };
      });
    return sb_rc_search;
  }
  //new function for bulk register

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
      //console.log("sb_rc_create err")
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
      //console.log("sb_rc_search err")
    }
  }
  async generateSchema(schemaId) {
    var config = {
      method: 'get',
      maxBodyLength: Infinity,
      url: `${schema_url}/schema/jsonld?id=${schemaId}`,
      headers: {},
    };

    try {
      const response = await axios(config);
      //console.log("response schema", response.data)
      return response.data;
    } catch (error) {
      //console.log("error schema", error)
    }
  }

  async generateDid(studentId) {
    var data = JSON.stringify({
      content: [
        {
          alsoKnownAs: [`did.${studentId}`],
          services: [
            {
              id: 'IdentityHub',
              type: 'IdentityHub',
              serviceEndpoint: {
                '@context': 'schema.identity.foundation/hub',
                '@type': 'UserServiceEndpoint',
                instance: ['did:test:hub.id'],
              },
            },
          ],
        },
      ],
    });

    var config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: `${did_url}/did/generate`,
      headers: {
        'Content-Type': 'application/json',
      },
      data: data,
    };

    try {
      const response = await axios(config);
      //console.log("response did", response.data)
      return response.data;
    } catch (error) {
      //console.log("did error", error.message)
    }
  }

  async issueCredentials(payload) {
    var data = JSON.stringify({
      credential: {
        '@context': [
          'https://www.w3.org/2018/credentials/v1',
          'https://www.w3.org/2018/credentials/examples/v1',
        ],
        id: 'did:ulp:b4a191af-d86e-453c-9d0e-dd4771067235',
        type: ['VerifiableCredential', 'UniversityDegreeCredential'],
        issuer: `${payload.issuerId}`,
        issuanceDate: payload.issuanceDate,
        expirationDate: payload.expirationDate,
        credentialSubject: payload.credentialSubject,
        options: {
          created: '2020-04-02T18:48:36Z',
          credentialStatus: {
            type: 'RevocationList2020Status',
          },
        },
      },
      credentialSchemaId: payload.credSchema.id,
      tags: ['tag1', 'tag2', 'tag3'],
    });

    var config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: 'http://64.227.185.154:3002/credentials/issue',
      headers: {
        'Content-Type': 'application/json',
      },
      data: data,
    };

    try {
      const response = await axios(config);
      //console.log("cred response")
      return response.data;
    } catch (e) {
      //console.log("cred error", e.message)
    }
  }

  //update
  async sbrcUpdate(updateSchema, entityName, osid) {
    //console.log("updateSchema", updateSchema)
    //console.log("entityName", entityName)
    //console.log("osid", osid)
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
      //console.log("sb_rc_update err")
    }
  }
}
