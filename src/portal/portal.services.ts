import { Injectable, StreamableFile } from '@nestjs/common';

//custom imports
import axios from 'axios';
import { Response, Request } from 'express';
//sbrc api
import { sbrcSearch } from '../utils/sbrc/sbrc_api';
import { KeycloakService } from '../services/keycloak/keycloak.service';
import { count } from 'rxjs';

@Injectable()
export class PortalService {
  constructor(private keycloakService: KeycloakService) {}
  //searchCount
  async searchCount(token: string, countFields: any, response: Response) {
    if (token && countFields.length > 0) {
      const username = await this.keycloakService.verifyUserToken(token);
      if (username?.error) {
        return response.status(401).send({
          success: false,
          status: 'keycloak_token_bad_request',
          message: 'Unauthorized',
          result: null,
        });
      } else if (!username?.preferred_username) {
        return response.status(401).send({
          success: false,
          status: 'keycloak_token_error',
          message: 'Keycloak Token Expired',
          result: null,
        });
      } else {
        const sb_rc_search = await sbrcSearch('TeacherV1', {
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
            status: 'sb_rc_no_did_found',
            message: 'Teacher not Found in Sunbird RC',
            result: null,
          });
        } else {
          let schoolUdise = sb_rc_search[0]?.schoolUdise;
          //count field start
          let countlog = {};
          for (let i = 0; i < countFields.length; i++) {
            let field = countFields[i];
            let fieldcount = 0;
            //students_registered
            if (field === 'students_registered') {
              const sb_rc_search_student_detail = await sbrcSearch(
                'StudentDetailV2',
                {
                  filters: {
                    school_udise: {
                      eq: schoolUdise,
                    },
                  },
                },
              );
              if (sb_rc_search_student_detail?.error) {
              } else {
                fieldcount = sb_rc_search_student_detail.length;
              }
            }
            //claims_pending
            if (field === 'claims_pending') {
              const sb_rc_search_student_detail = await sbrcSearch(
                'StudentDetailV2',
                {
                  filters: {
                    school_udise: {
                      eq: schoolUdise,
                    },
                    claim_status: {
                      eq: 'pending',
                    },
                  },
                },
              );
              if (sb_rc_search_student_detail?.error) {
              } else {
                fieldcount = sb_rc_search_student_detail.length;
              }
            }
            //claims_approved
            if (field === 'claims_approved') {
              const sb_rc_search_student_detail = await sbrcSearch(
                'StudentDetailV2',
                {
                  filters: {
                    school_udise: {
                      eq: schoolUdise,
                    },
                    claim_status: {
                      eq: 'approved',
                    },
                  },
                },
              );
              if (sb_rc_search_student_detail?.error) {
              } else {
                fieldcount = sb_rc_search_student_detail.length;
              }
            }
            //claims_rejected
            if (field === 'claims_rejected') {
              const sb_rc_search_student_detail = await sbrcSearch(
                'StudentDetailV2',
                {
                  filters: {
                    school_udise: {
                      eq: schoolUdise,
                    },
                    claim_status: {
                      eq: 'rejected',
                    },
                  },
                },
              );
              if (sb_rc_search_student_detail?.error) {
              } else {
                fieldcount = sb_rc_search_student_detail.length;
              }
            }
            //credentials_issued
            if (field === 'credentials_issued') {
              //find school did from school udise id
              let did = '';
              //find if student account present in sb rc or not
              const sb_rc_search = await sbrcSearch('SchoolDetail', {
                filters: {
                  udiseCode: {
                    eq: schoolUdise,
                  },
                },
              });
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
              var config = {
                method: 'post',
                url: process.env.CRED_URL + '/credentials/search',
                headers: {
                  'Content-Type': 'application/json',
                },
                data: data,
              };

              let render_response = null;
              await axios(config)
                .then(function (response) {
                  //console.log(JSON.stringify(response.data));
                  render_response = response.data;
                })
                .catch(function (error) {
                  //console.log(error);
                  render_response = { error: error };
                });

              if (render_response?.error) {
              } else {
                fieldcount = render_response.length;
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
}
