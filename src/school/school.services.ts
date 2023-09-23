import { Injectable, StreamableFile } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { AxiosRequestConfig } from 'axios';

//custom imports
import { Response, Request } from 'express';
import { UdiseService } from 'src/services/udise/udise.service';

@Injectable()
export class SchoolService {
  constructor(
    private readonly httpService: HttpService,
    private udiseService: UdiseService,
  ) {}

  //udiseDetail
  async udiseDetail(password: string, requestbody: any, response: Response) {
    if (password === '1234' || true) {
      if (requestbody) {
        const appKey = await this.udiseService.getAppKey();
        const response_text = await this.udiseService.getAuthorize(appKey);
        if (response_text?.error || response_text?.status === false) {
          return response.status(200).send({
            status: false,
            response: response_text,
          });
        } else {
          let authtoken = response_text?.data?.authToken;
          let sek = response_text?.data?.sek;
          //console.log('sek', sek);
          //console.log('appKey', appKey);
          ////console.log('authtoken', authtoken);
          if (authtoken && sek) {
            let dsek = await Buffer.from(sek, 'base64').toString('utf8');
            //console.log('dsek', dsek);
            let decryptedSek = await this.udiseService.decrypt(dsek, appKey);
            //console.log('decryptedSek', decryptedSek);
            let objStr = JSON.stringify(requestbody);
            //console.log('objStr', objStr);
            let et = await this.udiseService.encrypt(objStr, decryptedSek);
            //console.log('et', et);
            let data = JSON.stringify({
              data: et,
            });
            const url =
              'https://api.udiseplus.gov.in/school/v1.1/school-info/by-udise-code/public';
            let config_token = {
              headers: {
                'Content-Type': 'application/json',
                Authorization: 'Bearer ' + authtoken,
              },
            };
            //console.log('config_token', config_token);
            let response_text = null;

            try {
              const observable = this.httpService.post(url, data, config_token);
              const promise = observable.toPromise();
              const response = await promise;
              //console.log(JSON.stringify(response.data));
              response_text = response.data;
            } catch (e) {
              //console.log(e);
              response_text = { error: e };
            }

            if (response_text?.error || response_text?.status === false) {
              return response.status(200).send({
                status: false,
                response: response_text,
              });
            } else {
              return response.status(200).send({
                status: true,
                response: response_text,
              });
            }
          } else {
            return response.status(200).send({
              status: false,
              response: response_text,
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
    } else {
      response.status(200).send({ success: false, status: 'wrong_password' });
    }
  }

  //getStateList
  async getStateList(response: Response) {
    const appKey = await this.udiseService.getAppKey();
    const response_text = await this.udiseService.getAuthorize(appKey);
    if (response_text?.error || response_text?.status === false) {
      return response.status(200).send({
        status: false,
        response: response_text,
      });
    } else {
      let authtoken = response_text?.data?.authToken;
      //console.log('appKey', appKey);
      ////console.log('authtoken', authtoken);
      if (authtoken) {
        const url = 'https://api.udiseplus.gov.in/school/v1.1/states/public/rt';
        let config_token = {
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + authtoken,
          },
        };
        //console.log('config_token', config_token);
        let response_text = null;

        try {
          const observable = this.httpService.get(url, config_token);
          const promise = observable.toPromise();
          const response = await promise;
          //console.log(JSON.stringify(response.data));
          response_text = response.data;
        } catch (e) {
          //console.log(e);
          response_text = { error: e };
        }

        if (response_text?.error || response_text?.status === false) {
          return response.status(200).send({
            status: false,
            response: response_text,
          });
        } else {
          return response.status(200).send({
            status: true,
            response: response_text,
          });
        }
      } else {
        return response.status(200).send({
          status: false,
          response: response_text,
        });
      }
    }
  }

  //getDistrictList
  async getDistrictList(requestbody: any, response: Response) {
    if (requestbody) {
      const appKey = await this.udiseService.getAppKey();
      const response_text = await this.udiseService.getAuthorize(appKey);
      if (response_text?.error || response_text?.status === false) {
        return response.status(200).send({
          status: false,
          response: response_text,
        });
      } else {
        let authtoken = response_text?.data?.authToken;
        let sek = response_text?.data?.sek;
        //console.log('sek', sek);
        //console.log('appKey', appKey);
        ////console.log('authtoken', authtoken);
        if (authtoken && sek) {
          let dsek = await Buffer.from(sek, 'base64').toString('utf8');
          //console.log('dsek', dsek);
          let decryptedSek = await this.udiseService.decrypt(dsek, appKey);
          //console.log('decryptedSek', decryptedSek);
          let objStr = JSON.stringify(requestbody);
          //console.log('objStr', objStr);
          let et = await this.udiseService.encrypt(objStr, decryptedSek);
          //console.log('et', et);
          let data = JSON.stringify({
            data: et,
          });
          const url =
            'https://api.udiseplus.gov.in/school/v1.1/districts/public/rt';
          let config_token = {
            headers: {
              'Content-Type': 'application/json',
              Authorization: 'Bearer ' + authtoken,
            },
          };
          //console.log('config_token', config_token);
          let response_text = null;

          try {
            const observable = this.httpService.post(url, data, config_token);
            const promise = observable.toPromise();
            const response = await promise;
            //console.log(JSON.stringify(response.data));
            response_text = response.data;
          } catch (e) {
            //console.log(e);
            response_text = { error: e };
          }

          if (response_text?.error || response_text?.status === false) {
            return response.status(200).send({
              status: false,
              response: response_text,
            });
          } else {
            return response.status(200).send({
              status: true,
              response: response_text,
            });
          }
        } else {
          return response.status(200).send({
            status: false,
            response: response_text,
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

  //getBlockList
  async getBlockList(requestbody: any, response: Response) {
    if (requestbody) {
      const appKey = await this.udiseService.getAppKey();
      const response_text = await this.udiseService.getAuthorize(appKey);
      if (response_text?.error || response_text?.status === false) {
        return response.status(200).send({
          status: false,
          response: response_text,
        });
      } else {
        let authtoken = response_text?.data?.authToken;
        let sek = response_text?.data?.sek;
        //console.log('sek', sek);
        //console.log('appKey', appKey);
        ////console.log('authtoken', authtoken);
        if (authtoken && sek) {
          let dsek = await Buffer.from(sek, 'base64').toString('utf8');
          //console.log('dsek', dsek);
          let decryptedSek = await this.udiseService.decrypt(dsek, appKey);
          //console.log('decryptedSek', decryptedSek);
          let objStr = JSON.stringify(requestbody);
          //console.log('objStr', objStr);
          let et = await this.udiseService.encrypt(objStr, decryptedSek);
          //console.log('et', et);
          let data = JSON.stringify({
            data: et,
          });
          const url =
            'https://api.udiseplus.gov.in/school/v1.1/blocks/public/rt';
          let config_token = {
            headers: {
              'Content-Type': 'application/json',
              Authorization: 'Bearer ' + authtoken,
            },
          };
          //console.log('config_token', config_token);
          let response_text = null;

          try {
            const observable = this.httpService.post(url, data, config_token);
            const promise = observable.toPromise();
            const response = await promise;
            //console.log(JSON.stringify(response.data));
            response_text = response.data;
          } catch (e) {
            //console.log(e);
            response_text = { error: e };
          }

          if (response_text?.error || response_text?.status === false) {
            return response.status(200).send({
              status: false,
              response: response_text,
            });
          } else {
            return response.status(200).send({
              status: true,
              response: response_text,
            });
          }
        } else {
          return response.status(200).send({
            status: false,
            response: response_text,
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

  //getSchoolList
  async getSchoolList(requestbody: any, response: Response) {
    if (requestbody) {
      const appKey = await this.udiseService.getAppKey();
      const response_text = await this.udiseService.getAuthorize(appKey);
      if (response_text?.error || response_text?.status === false) {
        return response.status(200).send({
          status: false,
          response: response_text,
        });
      } else {
        let authtoken = response_text?.data?.authToken;
        let sek = response_text?.data?.sek;
        //console.log('sek', sek);
        //console.log('appKey', appKey);
        ////console.log('authtoken', authtoken);
        if (authtoken && sek) {
          let dsek = await Buffer.from(sek, 'base64').toString('utf8');
          //console.log('dsek', dsek);
          let decryptedSek = await this.udiseService.decrypt(dsek, appKey);
          //console.log('decryptedSek', decryptedSek);
          let objStr = JSON.stringify(requestbody);
          //console.log('objStr', objStr);
          let et = await this.udiseService.encrypt(objStr, decryptedSek);
          //console.log('et', et);
          let data = JSON.stringify({
            data: et,
          });
          const url =
            'https://api.udiseplus.gov.in/school/v1.1/school-info/by-region/public';
          let config_token = {
            headers: {
              'Content-Type': 'application/json',
              Authorization: 'Bearer ' + authtoken,
            },
          };
          console.log('config_token', config_token);
          let response_text = null;

          try {
            const observable = this.httpService.post(url, data, config_token);
            const promise = observable.toPromise();
            const response = await promise;
            console.log(JSON.stringify(response.data));
            response_text = response.data;
          } catch (e) {
            console.log(e);
            response_text = { error: e };
          }

          if (response_text?.error || response_text?.status === false) {
            return response.status(200).send({
              status: false,
              response: response_text,
            });
          } else {
            return response.status(200).send({
              status: true,
              response: response_text,
            });
          }
        } else {
          return response.status(200).send({
            status: false,
            response: response_text,
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

  //getSchoolMobileVerify
  async getSchoolMobileVerify(requestbody: any, response: Response) {
    if (requestbody) {
      const appKey = await this.udiseService.getAppKey();
      const response_text = await this.udiseService.getAuthorize(appKey);
      if (response_text?.error || response_text?.status === false) {
        return response.status(200).send({
          status: false,
          response: response_text,
        });
      } else {
        let authtoken = response_text?.data?.authToken;
        let sek = response_text?.data?.sek;
        //console.log('sek', sek);
        //console.log('appKey', appKey);
        ////console.log('authtoken', authtoken);
        if (authtoken && sek) {
          let dsek = await Buffer.from(sek, 'base64').toString('utf8');
          //console.log('dsek', dsek);
          let decryptedSek = await this.udiseService.decrypt(dsek, appKey);
          //console.log('decryptedSek', decryptedSek);
          let objStr = JSON.stringify(requestbody);
          //console.log('objStr', objStr);
          let et = await this.udiseService.encrypt(objStr, decryptedSek);
          //console.log('et', et);
          let data = JSON.stringify({
            data: et,
          });
          const url =
            'https://api.udiseplus.gov.in/school/v1.1/check-mobile-number/public';
          let config_token = {
            headers: {
              'Content-Type': 'application/json',
              Authorization: 'Bearer ' + authtoken,
            },
          };
          //console.log('config_token', config_token);
          let response_text = null;

          try {
            const observable = this.httpService.post(url, data, config_token);
            const promise = observable.toPromise();
            const response = await promise;
            //console.log(JSON.stringify(response.data));
            response_text = response.data;
          } catch (e) {
            //console.log(e);
            response_text = { error: e };
          }

          if (response_text?.error || response_text?.status === false) {
            return response.status(200).send({
              status: false,
              response: response_text,
            });
          } else {
            return response.status(200).send({
              status: true,
              response: response_text,
            });
          }
        } else {
          return response.status(200).send({
            status: false,
            response: response_text,
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
