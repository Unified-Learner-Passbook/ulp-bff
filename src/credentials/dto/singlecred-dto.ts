export class SingleCredentialDto {

    schoolDid: string;
    schoolName: string;
    schoolDistrict: string;
    schoolState: string;
    grade: string;
    academicYear: string;
    issuanceDate: string;
    expirationDate: string;
    credentialSubject: {
        issuer: string;
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
        class: string;
        gender: string;
        mobile: string,
        email: string;
        aadhaarId: string;
        districtId: string;
        blockId: string;
        villageId: string;
        schoolId: number,
        status: string;
        osid: string
    }
}
