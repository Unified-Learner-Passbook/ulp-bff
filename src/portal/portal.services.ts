import { Injectable, StreamableFile } from '@nestjs/common';

import { HttpService } from '@nestjs/axios';
import { AxiosRequestConfig } from 'axios';

//custom imports
import { Response, Request } from 'express';
//sbrc api
import { KeycloakService } from '../services/keycloak/keycloak.service';
import { SbrcService } from '../services/sbrc/sbrc.service';
import { CredService } from 'src/services/cred/cred.service';
import { count } from 'rxjs';

@Injectable()
export class PortalService {
  constructor(
    private readonly httpService: HttpService,
    private keycloakService: KeycloakService,
    private sbrcService: SbrcService,
    private credService: CredService,
  ) {}

  moment = require('moment');
  //searchCount
  async searchCount(token: string, countFields: any, response: Response) {
    if (token && countFields.length > 0) {
      const instructorUsername = await this.keycloakService.getUserTokenAccount(
        token,
      );

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
          dob = await this.convertDate(instructorUsername?.attributes?.dob[0]);
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
        //console.log('Instructor Details', instructorDetails);
        if (instructorDetails.length == 0) {
          //register in keycloak and then in sunbird rc
          return response.status(400).send({
            success: false,
            status: 'sbrc_instructor_no_found_error',
            message: 'Instructor Account Not Found. Register and Try Again.',
            result: null,
          });
        } else if (instructorDetails.length > 0) {
          //get count
          const school_id = instructorDetails[0]?.school_id;
          //count field start
          let countlog = {};
          for (let i = 0; i < countFields.length; i++) {
            let field = countFields[i];
            let fieldcount = 0;
            //students_registered
            //console.log('school_id', school_id);
            if (field === 'students_registered') {
              if (school_id) {
                const searchFilter = await this.credService.credSearchFilter({
                  orgId: school_id,
                });
                //console.log('searchFilter', searchFilter);
                try {
                  if (searchFilter?.error) {
                  } else {
                    fieldcount = searchFilter.length;
                  }
                } catch (e) {}
              }
            }
            //claims_pending
            if (field === 'claims_pending') {
              fieldcount = 0;
            }
            //claims_approved
            if (field === 'claims_approved') {
              fieldcount = 0;
            }
            //claims_rejected
            if (field === 'claims_rejected') {
              fieldcount = 0;
            }
            countlog[field] = fieldcount;
          }
          return response.status(200).send({
            success: true,
            status: 'count_success',
            message: 'Count Success',
            result: countlog,
          }); 
        } else {
          return response.status(200).send({
            success: false,
            status: 'sbrc_search_error',
            message: 'Unable to search Instructor. Try Again.',
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
