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
      academicYear: string
    }
    credentialSubject: [
      {
        id: any,
        studentName: string,
        dob: string,
        reference_id: string,
        aadhar_token: string,
        guardianName: string,
        enrolledOn: string
      }
    ]
  }