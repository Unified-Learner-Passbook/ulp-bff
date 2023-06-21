export class BulkCredentialDto {
  clientId: string;
  clientSecret: string;
  issuerDetail: {
    did: string;
    udise: string;
    schoolName: string;
    schoolDid: string;
  };
  vcData: {
    issuanceDate: string;
    expirationDate: string;
  };
  credentialSubjectCommon: {
    grade: string;
    academic_year: string;
    benefitProvider: string;
    schemeName: string;
    schemeId: string;
    assessment: string;
    quarterlyAssessment: string;
    total: string;
    schoolName: string;
    stateCode: string;
    stateName: string;
    districtCode: string;
    districtName: string;
    blockCode: string;
    blockName: string;
  };
  credentialSubject: [
    {
      id: any;
      student_id: string;
      student_name: string;
      dob: string;
      reference_id: string;
      aadhar_token: string;
      guardian_name: string;
      enrolled_on: string;
      grade: string;
      academic_year: string;
      benefitProvider: string;
      schemeName: String;
      schemeId: string;
      transactionAmount: string;
      transactionId: string;
      assessment: string;
      quarterlyAssessment: string;
      marks: string;
      total: string;
      schoolName: string;
      school_name: string;
      school_id: string;
      gender: string;
      stateCode: string;
      stateName: string;
      districtCode: string;
      districtName: string;
      blockCode: string;
      blockName: string;
    },
  ];
}
