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
export class GrievanceService {
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
    grv_school_id: string,
    grv_school_name: string,
    grvSubject: string,
    grvDesc: string,
    response: Response,
  ) {
    if (
      token &&
      credential_schema_id &&
      grv_school_id &&
      grv_school_name &&
      grvSubject &&
      grvDesc
    ) {
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
            grv_school_id: grv_school_id,
            grv_school_name: grv_school_name,
            credential_schema_id: credential_schema_id,
            grv_by: osid,
            grv_status: 'raise',
            grv_from: 'Learner',
            reply_by: '',
            reply_from: '',
            grvSubject: grvSubject,
            grvDesc: grvDesc,
          };

          let sbrcInviteResponse = await this.sbrcService.sbrcInviteEL(
            requestbody,
            'Grievance',
          );

          return response.status(200).send({
            success: true,
            status: 'grievance_raise_success',
            message: 'Grievance Raise Success',
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
          let grv_school_id = userDetails[0]?.school_id;
          let user_osid = userDetails[0]?.osid;

          let requestbody = {};
          if (type === 'teacher') {
            requestbody = {
              filters: {
                grv_school_id: {
                  eq: grv_school_id,
                },
                grv_status: {
                  eq: 'raise',
                },
              },
            };
          } else {
            requestbody = {
              filters: {
                grv_by: {
                  eq: user_osid,
                },
                grv_status: {
                  eq: 'raise',
                },
              },
            };
          }

          const sbrcSearch = await this.sbrcService.sbrcSearchEL(
            'Grievance',
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

  public async reply(token: string, grv_os_id: string, response) {
    if (token && grv_os_id) {
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
        if (instructorDetails.length == 0) {
          //register in keycloak and then in sunbird rc
          return response.status(400).send({
            success: false,
            status: 'sbrc_instructor_no_found_error',
            message: 'Instructor Account Not Found. Register and Try Again.',
            result: null,
          });
        } else if (instructorDetails.length > 0) {
          const osid = instructorDetails[0]?.osid;
          let requestBody = {
            reply_by: osid,
            grv_status: 'replied',
            reply_from: 'Instructor',
          };
          const updateSearch = await this.sbrcService.sbrcUpdateEL(
            requestBody,
            'Grievance',
            grv_os_id,
          );
          if (updateSearch?.error) {
            return response.status(400).send({
              success: false,
              status: 'grievance_api_unsuccessful',
              message: 'Grievance API Unsuccessful',
              result: updateSearch,
            });
          } else {
            response.status(200).send({
              success: true,
              status: 'grievance_api_successful',
              message: 'Grievance API Successful',
            });
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
