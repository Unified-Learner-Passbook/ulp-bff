//custom imports
import axios from 'axios';
var parser = require('xml2json');

const addhar_aua_url = 'https://uatauakua.auashreetron.com/clientgwapi';

//aadhaarDemographic
export const aadhaarDemographic = async (
  aadhaar_id: string,
  aadhaar_name: string,
) => {
  if (aadhaar_id && aadhaar_name) {
    const rrn = await getRRN();
    //call gov api
    let data = {
      AUAKUAParameters: {
        LAT: '17.494568',
        LONG: '78.392056',
        DEVMACID: '11:22:33:44:55',
        DEVID: 'F0178BF2AA61380FBFF0',
        CONSENT: 'Y',
        SHRC: 'Y',
        VER: '2.5',
        SERTYPE: '07',
        ENV: '2',
        SLK: 'LIPCR-SYMQL-KOXVX-WVJZR',
        RRN: rrn,
        REF: 'FROMSAMPLE',
        UDC: '',
        ISPA: 'false',
        ISPFA: 'false',
        ISPI: 'true',
        NAME: aadhaar_name,
        AADHAARID: aadhaar_id,
      },
      PIDXml: '',
      Environment: '0',
    };

    let config = {
      method: 'post',
      url: addhar_aua_url + '/api/Aadhaar/DoDemoAuth',
      headers: {
        'Content-Type': 'application/json',
      },
      data: data,
    };
    //console.log('config', config);
    let response_text = null;
    await axios(config)
      .then(function (response) {
        //console.log(JSON.stringify(response.data));
        response_text = response.data;
      })
      .catch(function (error) {
        //console.log(error);
        response_text = { error: error };
      });
    if (response_text?.error) {
      return {
        success: false,
        status: 'aadhaar_error',
        message: 'Aadhaar Error',
        result: response_text?.error,
      };
    } else {
      const responseXML = response_text?.responseXML;
      const decodedxml = Buffer.from(responseXML, 'base64').toString('utf8');
      return {
        success: true,
        status: 'aadhaar_success',
        message: 'Aadhaar Success',
        result: response_text,
        decodedxml: decodedxml,
      };
    }
  } else {
    return {
      success: false,
      status: 'invalid_request',
      message: 'Invalid Request. Not received All Parameters.',
      result: null,
    };
  }
};

//getUUID
export const getUUID = async (xmldata) => {
  try {
    var json = parser.toJson(xmldata);
    //console.log(json);
    const jsonobj = JSON.parse(json);
    return jsonobj?.AuthRes?.uuid ? jsonobj.AuthRes.uuid : null;
  } catch (e) {
    return null;
  }
};

//helper function
//generate rrn
const getRRN = async () => {
  let length = 20;
  let chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  var result = '';
  for (var i = length; i > 0; --i)
    result += chars[Math.floor(Math.random() * chars.length)];
  let timestamp = Math.floor(Date.now() / 1000).toString();
  result += timestamp;
  return result;
};
