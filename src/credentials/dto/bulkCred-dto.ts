export class BulkCredentialDto {
  issuerDetail: {
    udise: string,
    schoolName: string,
    schoolDid: string
  }
  vcData: {
    issuanceDate: string,
    expirationDate: string
  }
  credentialSubjectCommon: {
    grade: string,
    academicYear: string,
    benefitProvider: string,
    schemeName: string,
    schemeId: string,
    assessment: string,
    quarterlyAssessment: string,
    total: string,
    schoolName: string
  }
  credentialSubject: [
    {
      id: any,
      studentId: string,
      studentName: string,
      dob: string,
      reference_id: string,
      aadhar_token: string,
      guardianName: string,
      enrolledOn: string,
      grade: string,
      academicYear: string,
      benefitProvider: string,
      schemeName: String,
      schemeId: string,
      transactionAmount: string,
      transactionId: string,
      assessment: string,
      quarterlyAssessment: string,
      marks: string,
      total: string,
      schoolName: string
    }
  ]
}