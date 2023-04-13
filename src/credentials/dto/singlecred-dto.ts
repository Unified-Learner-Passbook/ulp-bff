export class SingleCredentialDto {

    schoolDid: string;
    schoolName: string;
    schoolDistrict: string;
    schoolState: string;
    grade: string;
    academicYear: string;
    issuanceDate: string;
    expirationDate: string;
    issuer: string;
    vcData: {
        issuanceDate: string,
        expirationDate: string
      }
    credentialSubject: {
        id: any;
        credentialSubject: { id: any; grade: string; programme: any; certifyingInstitute: any; evaluatingInstitute: any; };
        credSchema: void;
        grade: string;
        school_name: string;
        academic_year: string;
        credId: any;
        issuerId: string;
        evaluatingInstitute: any;
        certifyingInstitute: any;
        programme: any;
        studentId: string;
        student_name: string;
        fatherName: string;
        motherName: string;
        guardian_name: string;
        age: string;
        class: string;
        gender: string;
        mobile: string,
        email: string;
        aadhaarId: string;
        districtId: string;
        blockId: string;
        villageId: string;
        schoolId: string,
        status: string;
        osid: string;
        student_osid: string,
        aadhar_token: string,
        student_id: string,
        dob: string,
        reference_id: string,
        
    }
}
