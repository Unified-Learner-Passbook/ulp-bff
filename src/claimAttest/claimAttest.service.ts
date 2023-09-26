import { Injectable } from '@nestjs/common';
import { AxiosRequestConfig } from 'axios';
import { HttpService } from '@nestjs/axios';
import { response } from 'express';
import { SbrcService } from 'src/services/sbrc/sbrc.service';
import { KeycloakService } from 'src/services/keycloak/keycloak.service';
import { CredService } from 'src/services/cred/cred.service';
import { Response, Request } from 'express';
import { log } from 'console';

@Injectable()
export class ClaimAttestService {
  constructor(
    private readonly httpService: HttpService,
    private sbrcService: SbrcService,
    private keycloakService: KeycloakService,
    private credService: CredService,
  ) {}
  moment = require('moment');

  public test() {
    console.log('Test Function Success');
  }
  public async sent(
    token: string,
    credential_schema_id: string,
    credentialSubject: any,
    response: Response,
  ) {
    if (token && credential_schema_id && credentialSubject) {
      let attest_school_id = credentialSubject?.orgId
        ? credentialSubject.orgId
        : '';
      let attest_school_name = credentialSubject?.orgName
        ? credentialSubject.orgName
        : '';
      const learnerUsername = await this.keycloakService.getUserTokenAccount(
        token,
      );

      if (learnerUsername?.error) {
        return response.status(401).send({
          success: false,
          status: 'keycloak_token_bad_request',
          message: 'You do not have access for this request.',
          result: null,
        });
      } else if (!learnerUsername?.username) {
        return response.status(401).send({
          success: false,
          status: 'keycloak_token_error',
          message: 'Your Login Session Expired.',
          result: null,
        });
      } else {
        let name = '';
        let dob = '';
        let gender = '';
        if (
          learnerUsername?.attributes?.gender &&
          learnerUsername?.attributes?.dob &&
          learnerUsername?.attributes?.name
        ) {
          //login with digilocker
          name = learnerUsername?.attributes?.name[0];
          dob = await this.convertDate(learnerUsername?.attributes?.dob[0]);
          gender = learnerUsername?.attributes?.gender[0];
        } else {
          //login with mobile and otp
          const sb_rc_search = await this.sbrcService.sbrcSearchEL('Learner', {
            filters: {
              username: {
                eq: learnerUsername?.username,
              },
            },
          });

          if (sb_rc_search?.error) {
            return response.status(501).send({
              success: false,
              status: 'sb_rc_search_error',
              message: 'System Search Error ! Please try again.',
              result: sb_rc_search?.error.message,
            });
          } else if (sb_rc_search.length === 0) {
            return response.status(404).send({
              success: false,
              status: 'sb_rc_search_no_found',
              message: 'Data Not Found in System.',
              result: null,
            });
          } else {
            name = sb_rc_search[0].name;
            dob = sb_rc_search[0].dob;
            gender = sb_rc_search[0].gender;
          }
        }
        //search count
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

        const learnerDetails = await this.sbrcService.sbrcSearch(
          searchSchema,
          'Learner',
        );

        if (learnerDetails.length == 0) {
          //register in keycloak and then in sunbird rc
          return response.status(400).send({
            success: false,
            status: 'sbrc_instructor_no_found_error',
            message: 'Learner Account Not Found. Register and Try Again.',
            result: null,
          });
        } else if (learnerDetails.length > 0) {
          //get count
          const osid = learnerDetails[0]?.osid;

          const requestbody = {
            attest_school_id: attest_school_id,
            attest_school_name: attest_school_name,
            credential_schema_id: credential_schema_id,
            credentialSubject: credentialSubject,
            claim_by: osid,
            claim_status: 'raise',
            claim_from: 'Learner',
            attest_by: '',
            attest_from: '',
          };

          let sbrcInviteResponse = await this.sbrcService.sbrcInviteEL(
            requestbody,
            'ClaimAttestSchema',
          );

          return response.status(200).send({
            success: true,
            status: 'claim_attest success',
            message: 'ClaimAttest Success',
            result: null,
          });
        } else {
          return response.status(200).send({
            success: false,
            status: 'sbrc_search_error',
            message: 'Unable to search Learner. Try Again.',
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

  public async search(token: string, type: string, response) {
    if (token && type) {
      console.log(token);

      const userSearch = await this.keycloakService.getUserTokenAccount(token);
      console.log(JSON.stringify(userSearch));

      if (userSearch?.error) {
        return response.status(401).send({
          success: false,
          status: 'keycloak_token_bad_request',
          message: 'You do not have access for this request.',
          result: null,
        });
      } else if (!userSearch?.username) {
        return response.status(401).send({
          success: false,
          status: 'keycloak_token_error',
          message: 'Your Login Session Expired.',
          result: null,
        });
      } else {
        let name = '';
        let dob = '';
        let gender = '';
        if (
          userSearch?.attributes?.gender &&
          userSearch?.attributes?.dob &&
          userSearch?.attributes?.name
        ) {
          //login with digilocker
          name = userSearch?.attributes?.name[0];
          dob = await this.convertDate(userSearch?.attributes?.dob[0]);
          gender = userSearch?.attributes?.gender[0];
        } else {
          //login with mobile and otp
          const sb_rc_search = await this.sbrcService.sbrcSearchEL(
            type === 'teacher' ? 'Instructor' : 'Learner',
            {
              filters: {
                username: {
                  eq: userSearch?.username,
                },
              },
            },
          );

          if (sb_rc_search?.error) {
            return response.status(501).send({
              success: false,
              status: 'sb_rc_search_error',
              message: 'System Search Error ! Please try again.',
              result: sb_rc_search?.error.message,
            });
          } else if (sb_rc_search.length === 0) {
            return response.status(404).send({
              success: false,
              status: 'sb_rc_search_no_found',
              message: 'Data Not Found in System.',
              result: null,
            });
          } else {
            name = sb_rc_search[0].name;
            dob = sb_rc_search[0].dob;
            gender = sb_rc_search[0].gender;
          }
        }

        //search count
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

        const userDetails = await this.sbrcService.sbrcSearch(
          searchSchema,
          type === 'teacher' ? 'Instructor' : 'Learner',
        );
        if (!userDetails?.error) {
          let attest_school_id = userDetails[0]?.school_id;
          let user_osid = userDetails[0]?.osid;

          let requestbody = {};
          if (type === 'teacher') {
            requestbody = {
              filters: {
                attest_school_id: {
                  eq: attest_school_id,
                },
                claim_status: {
                  eq: 'raise',
                },
              },
            };
          } else {
            requestbody = {
              filters: {
                claim_by: {
                  eq: user_osid,
                },
                claim_status: {
                  eq: 'raise',
                },
              },
            };
          }

          const sbrcSearch = await this.sbrcService.sbrcSearchEL(
            'ClaimAttestSchema',
            requestbody,
          );
          if (sbrcSearch.length > 0) {
            return response.status(200).send({
              success: true,
              status: 'search_success',
              message: 'Search Success',
              result: sbrcSearch,
            });
          } else {
            return response.status(200).send({
              success: true,
              status: 'search_success',
              message: 'Data not present in the system.',
              result: sbrcSearch,
            });
          }
        } else {
          return response.status(400).send({
            success: false,
            status: 'search_fail',
            message: 'user account search error.',
            result: userDetails,
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

    console.log('Search Function Success');
  }

  public async attest(
    token: string,
    claim_status: string,
    claim_os_id: string,
    issuanceDate: string,
    expirationDate: string,
    response,
  ) {
    if (
      token &&
      claim_status &&
      claim_os_id &&
      issuanceDate &&
      expirationDate
    ) {
      const sbrcSearchClaim = await this.sbrcService.sbrcSearchEL(
        'ClaimAttestSchema',
        {
          filters: {
            osid: {
              eq: claim_os_id,
            },
          },
        },
      );

      if (
        sbrcSearchClaim[0]?.credential_schema_id &&
        sbrcSearchClaim[0]?.credentialSubject
      ) {
        const credential_schema_id = sbrcSearchClaim[0].credential_schema_id;
        const credentialSubject = sbrcSearchClaim[0].credentialSubject;
        if (credentialSubject?.osid) {
          delete credentialSubject['osid'];
        }
        const instructorUsername =
          await this.keycloakService.getUserTokenAccount(token);
        if (instructorUsername?.error) {
          return response.status(401).send({
            success: false,
            status: 'keycloak_token_bad_request',
            message: 'You do not have access for this request.',
            result: null,
          });
        } else if (!instructorUsername?.username) {
          return response.status(401).send({
            success: false,
            status: 'keycloak_token_error',
            message: 'Your Login Session Expired.',
            result: null,
          });
        } else {
          let name = '';
          let dob = '';
          let gender = '';
          if (
            instructorUsername?.attributes?.gender &&
            instructorUsername?.attributes?.dob &&
            instructorUsername?.attributes?.name
          ) {
            //login with digilocker
            name = instructorUsername?.attributes?.name[0];
            dob = await this.convertDate(
              instructorUsername?.attributes?.dob[0],
            );
            gender = instructorUsername?.attributes?.gender[0];
          } else {
            //login with mobile and otp
            const sb_rc_search = await this.sbrcService.sbrcSearchEL(
              'Instructor',
              {
                filters: {
                  username: {
                    eq: instructorUsername?.username,
                  },
                },
              },
            );
            if (sb_rc_search?.error) {
              return response.status(501).send({
                success: false,
                status: 'sb_rc_search_error',
                message: 'System Search Error ! Please try again.',
                result: sb_rc_search?.error.message,
              });
            } else if (sb_rc_search.length === 0) {
              return response.status(404).send({
                success: false,
                status: 'sb_rc_search_no_found',
                message: 'Data Not Found in System.',
                result: null,
              });
            } else {
              name = sb_rc_search[0].name;
              dob = sb_rc_search[0].dob;
              gender = sb_rc_search[0].gender;
            }
          }
          //search count
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
          const instructorDetails = await this.sbrcService.sbrcSearch(
            searchSchema,
            'Instructor',
          );
          if (instructorDetails.length == 0) {
            //register in keycloak and then in sunbird rc
            return response.status(400).send({
              success: false,
              status: 'sbrc_instructor_no_found_error',
              message: 'Instructor Account Not Found. Register and Try Again.',
              result: null,
            });
          } else if (instructorDetails.length > 0) {
            if (claim_status == 'approved') {
              const issuer_did = instructorDetails[0].issuer_did;
              //did get student and update it
              let student_did = '';
              let student_osid = sbrcSearchClaim[0].claim_by;
              // find student
              let searchSchema = {
                filters: {
                  osid: {
                    eq: student_osid,
                  },
                },
              };
              const studentDetails = await this.sbrcService.sbrcSearch(
                searchSchema,
                'Learner',
              );
              console.log('Learner Details', studentDetails);
              if (
                typeof studentDetails !== 'undefined' &&
                studentDetails !== null
              ) {
                if (studentDetails.length > 0) {
                  if (studentDetails[0]?.did) {
                    student_did = studentDetails[0].did;
                  } else {
                    let didRes = await this.credService.generateDid(
                      student_osid,
                    );
                    console.log('did', didRes);
                    if (didRes) {
                      student_did = didRes[0].verificationMethod[0].controller;
                      let updateRes = await this.sbrcService.sbrcUpdate(
                        {
                          did: student_did,
                        },
                        'Learner',
                        studentDetails[0].osid,
                      );
                      if (updateRes) {
                      } else {
                        return response.status(400).send({
                          success: false,
                          status: 'student_update_failed',
                          message:
                            'Unable to Update Student Account DID ! Please Try Again.',
                          result: null,
                        });
                      }
                    } else {
                      return response.status(400).send({
                        success: false,
                        status: 'student_did_update_failed',
                        message: 'unable to generate student did!',
                        result: null,
                      });
                    }
                  }
                } else {
                  return response.status(400).send({
                    success: false,
                    status: 'student_search_no_found',
                    message: 'Student Account Not Found ! Please Try Again.',
                    result: null,
                  });
                }
              } else {
                return response.status(400).send({
                  success: false,
                  status: 'student_search_failed',
                  message:
                    'Unable to Search Student Account ! Please Try Again.',
                  result: null,
                });
              }
              //issue cred
              credentialSubject.id = student_did;
              let payload = {
                issuerId: issuer_did,
                issuanceDate: issuanceDate,
                expirationDate: expirationDate,
                credentialSubject: credentialSubject,
                credSchema: {
                  id: credential_schema_id,
                  version: '1.0.0',
                },
              };
              const issueCredential = await this.credService.issueCredentialsEL(
                payload,
              );
              if (issueCredential?.error) {
                return response.status(400).send({
                  success: false,
                  status: 'issue_credentials_failed',
                  message: 'Issue Credentials Failed.',
                  result: null,
                });
              } else {
                const osid = instructorDetails[0]?.osid;
                const updateStatusPayload = {
                  claim_status: claim_status,
                  attest_by: osid,
                  attest_from: 'Instructor',
                };
                const updateStatus = await this.sbrcService.sbrcUpdateEL(
                  updateStatusPayload,
                  'ClaimAttestSchema',
                  claim_os_id,
                );
                if (updateStatus?.error) {
                  return response.status(400).send({
                    success: false,
                    status: 'claim_api_unsuccessful',
                    message: 'Claim API Unsuccessful',
                    result: updateStatus,
                  });
                } else {
                  return response.status(200).send({
                    success: true,
                    status: 'claim_api_successful',
                    message: 'Claim API Successful',
                    result: updateStatus,
                  });
                }
              }
            } else if (claim_status == 'rejected') {
              const osid = instructorDetails[0]?.osid;
              let requestBody = {
                attest_by: osid,
                claim_status: claim_status,
                attest_from: 'Instructor',
              };
              const updateSearch = await this.sbrcService.sbrcUpdateEL(
                requestBody,
                'ClaimAttestSchema',
                claim_os_id,
              );
              if (updateSearch?.error) {
                return response.status(400).send({
                  success: false,
                  status: 'claim_api_unsuccessful',
                  message: 'Claim API Unsuccessful',
                  result: updateSearch,
                });
              } else {
                response.status(200).send({
                  success: true,
                  status: 'reject_claim_successful',
                  message: 'Reject Claim Successful',
                });
              }
            }
          } else {
            //register in keycloak and then in sunbird rc
            return response.status(400).send({
              success: false,
              status: 'sbrc_instructor_no_found_error',
              message: 'Instructor Account Not Found. Register and Try Again.',
              result: null,
            });
          }
        }
      } else {
        return response.status(400).send({
          success: false,
          status: 'claim_request_not_found',
          message: 'Claim request not found.',
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
    console.log('Attest Function Success');
  }

  //helper function
  //get convert date and repalce character from string
  async convertDate(datetime) {
    if (!datetime) {
      return '';
    }
    let date_string = datetime.substring(0, 10);
    const datetest = this.moment(date_string, 'DD/MM/YYYY').format(
      'DD/MM/YYYY',
    );
    return datetest;
  }
}
