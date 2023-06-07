import { Injectable, StreamableFile } from '@nestjs/common';

import { HttpService } from '@nestjs/axios';
import { AxiosRequestConfig } from 'axios';

//custom imports
import { Response, Request } from 'express';
//sbrc api
import { KeycloakService } from '../services/keycloak/keycloak.service';
import { SbrcService } from '../services/sbrc/sbrc.service';
import { CredService } from 'src/services/cred/cred.service';
import { AadharService } from '../services/aadhar/aadhar.service';
import { count } from 'rxjs';

@Injectable()
export class PortalService {
  constructor(
    private readonly httpService: HttpService,
    private keycloakService: KeycloakService,
    private sbrcService: SbrcService,
    private credService: CredService,
    private aadharService: AadharService,
  ) {}
  //searchCount
  async searchCount(token: string, countFields: any, response: Response) {
    if (token && countFields.length > 0) {
      const username = await this.keycloakService.verifyUserToken(token);
      if (username?.error) {
        return response.status(401).send({
          success: false,
          status: 'keycloak_token_bad_request',
          message: 'You do not have access for this request.',
          result: null,
        });
      } else if (!username?.preferred_username) {
        return response.status(401).send({
          success: false,
          status: 'keycloak_token_error',
          message: 'Your Login Session Expired.',
          result: null,
        });
      } else {
        const sb_rc_search = await this.sbrcService.sbrcSearchEL('TeacherV1', {
          filters: {
            username: {
              eq: username?.preferred_username,
            },
          },
        });
        if (sb_rc_search?.error) {
          return response.status(501).send({
            success: false,
            status: 'sb_rc_search_error',
            message: 'Sunbird RC Teacher Search Failed',
            result: sb_rc_search?.error,
          });
        } else if (sb_rc_search.length === 0) {
          return response.status(404).send({
            success: false,
            status: 'sb_rc_search_no_found',
            message: 'Data Not Found in System.',
            result: null,
          });
        } else {
          let schoolUdise = sb_rc_search[0]?.schoolUdise;
          //count field start
          let countlog = {};
          //common student list from udise code
          const sb_rc_search_student_udise_code =
            await this.sbrcService.sbrcSearchEL('StudentV2', {
              filters: {
                school_udise: {
                  eq: schoolUdise,
                },
              },
            });
          for (let i = 0; i < countFields.length; i++) {
            let field = countFields[i];
            let fieldcount = 0;
            //students_registered
            if (field === 'students_registered') {
              if (sb_rc_search_student_udise_code?.error) {
              } else {
                fieldcount = sb_rc_search_student_udise_code.length;
              }
            }
            //claims_pending
            if (field === 'claims_pending') {
              fieldcount = 0;
              for (let i = 0; i < sb_rc_search_student_udise_code.length; i++) {
                const sb_rc_search_student_detail =
                  await this.sbrcService.sbrcSearchEL('StudentDetailV2', {
                    filters: {
                      student_id: {
                        eq: sb_rc_search_student_udise_code[i].osid,
                      },
                      claim_status: {
                        eq: 'pending',
                      },
                    },
                  });
                if (sb_rc_search_student_detail?.error) {
                } else if (sb_rc_search_student_detail.length !== 0) {
                  fieldcount++;
                }
              }
            }
            //claims_approved
            if (field === 'claims_approved') {
              fieldcount = 0;
              for (let i = 0; i < sb_rc_search_student_udise_code.length; i++) {
                const sb_rc_search_student_detail =
                  await this.sbrcService.sbrcSearchEL('StudentDetailV2', {
                    filters: {
                      student_id: {
                        eq: sb_rc_search_student_udise_code[i].osid,
                      },
                      claim_status: {
                        eq: 'approved',
                      },
                    },
                  });
                if (sb_rc_search_student_detail?.error) {
                } else if (sb_rc_search_student_detail.length !== 0) {
                  fieldcount++;
                }
              }
            }
            //claims_rejected
            if (field === 'claims_rejected') {
              fieldcount = 0;
              for (let i = 0; i < sb_rc_search_student_udise_code.length; i++) {
                const sb_rc_search_student_detail =
                  await this.sbrcService.sbrcSearchEL('StudentDetailV2', {
                    filters: {
                      student_id: {
                        eq: sb_rc_search_student_udise_code[i].osid,
                      },
                      claim_status: {
                        eq: 'rejected',
                      },
                    },
                  });
                if (sb_rc_search_student_detail?.error) {
                } else if (sb_rc_search_student_detail.length !== 0) {
                  fieldcount++;
                }
              }
            }
            //credentials_issued
            if (field === 'credentials_issued') {
              //find school did from school udise id
              let did = '';
              //find if student account present in sb rc or not
              const sb_rc_search = await this.sbrcService.sbrcSearchEL(
                'SchoolDetail',
                {
                  filters: {
                    udiseCode: {
                      eq: schoolUdise,
                    },
                  },
                },
              );
              if (sb_rc_search?.error) {
              } else if (sb_rc_search.length === 0) {
                // no school found
              } else {
                //get did id
                did = sb_rc_search[0].did;
              }
              //get issues credentials list from school did
              var data = JSON.stringify({
                issuer: {
                  id: did,
                },
              });

              const url = process.env.CRED_URL + '/credentials/search';
              const config: AxiosRequestConfig = {
                headers: {
                  'Content-Type': 'application/json',
                },
              };

              let render_response = null;
              try {
                const observable = this.httpService.post(url, data, config);
                const promise = observable.toPromise();
                const response = await promise;
                //console.log(JSON.stringify(response.data));
                render_response = response.data;
              } catch (e) {
                //console.log(e);
                render_response = { error: e };
              }

              if (render_response?.error) {
              } else {
                //check only student count
                let fieldcount_student = 0;
                for (let i = 0; i < render_response.length; i++) {
                  if (render_response[i]?.credentialSubject?.student_name) {
                    fieldcount_student++;
                  }
                }
                fieldcount = fieldcount_student;
              }
            }
            countlog[field] = fieldcount;
          }
          return response.status(200).send({
            success: true,
            status: 'count_success',
            message: 'Count Success',
            result: countlog,
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
  //getDID
  async getDID(uniquetext: string, response: Response) {
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
    } else {
      return response.status(400).send({
        success: false,
        status: 'invalid_request',
        message: 'Invalid Request. Not received All Parameters.',
        result: null,
      });
    }
  }
  //getAadhaar
  async getAadhaar(
    aadhaar_id: string,
    aadhaar_name: string,
    aadhaar_dob: string,
    aadhaar_gender: string,
    response: Response,
  ) {
    if (aadhaar_id && aadhaar_name && aadhaar_dob && aadhaar_gender) {
      const aadhar_data = await this.aadharService.aadhaarDemographic(
        aadhaar_id,
        aadhaar_name,
        aadhaar_dob,
        aadhaar_gender,
      );
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
              result: null,
            });
          } else {
            return response.status(200).send({
              success: true,
              status: 'aadhaar_verify_success',
              message: 'Aadhaar Verify Success',
              result: { uuid: uuid },
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
}
