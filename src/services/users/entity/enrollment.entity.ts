import { Column, Entity, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Enrollment {
  @PrimaryColumn()
  Id: string;

  @Column({ nullable: true })
  name: string;

  @Column({ nullable: true })
  dob: string;

  @Column({ nullable: true })
  gender: string;

  @Column({ nullable: true })
  aadhaar_id: string;

  @Column({ nullable: true })
  orgname: string;

  @Column({ nullable: true })
  orgid: string;

  @Column({ nullable: true })
  orgaddress: string;

  @Column({ nullable: true })
  orgcontact: string;

  @Column({ nullable: true })
  orgemail: string;

  @Column({ nullable: true })
  associatedsince: string;

  @Column({ nullable: true })
  contact: string;

  @Column({ nullable: true })
  orglogo: string;

  @Column({ nullable: true })
  profileimage: string;

  @Column({ nullable: true })
  associatedtill: string;

  @Column({ nullable: true })
  emergencycontact: string;

  @Column({ nullable: true })
  unitassociatedwith: string;
}
