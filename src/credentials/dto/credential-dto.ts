export class CredentialDto {
    
  schoolDid: string;
  schoolName: string;
  schoolDistrict: string;
  schoolState: string;
  grade: string;
  academicYear: string;
  issuanceDate: string;
  issuer: string;
  expirationDate: string;
      credentialSubject:[
          {
          id: any;
          credentialSubject: { id: any; grade: string; programme: any; certifyingInstitute: any; evaluatingInstitute: any; };
          credSchema: void;
          grade: string;
          schoolName: string;
          academicYear: string;
          credId: any;
          issuerId: string;
          evaluatingInstitute: any;
          certifyingInstitute: any;
          programme: any;
          studentId: string;
          studentName: string;
          fatherName: string;
          motherName: string;
          guardianName: string;
          age: string;
          dob: string;
          class: string;
          gender: string;
          mobile: number,
          email: string;
          aadhaarId: string;
          districtId: string;
          blockId: string;
          villageId: string;
          schoolId: number,
          status: string;
          }
          
  ]


}