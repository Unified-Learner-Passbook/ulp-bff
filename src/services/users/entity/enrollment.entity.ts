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
  orgName: string;

  @Column({ nullable: true })
  orgId: string;

  @Column({ nullable: true })
  orgAddress: string;

  @Column({ nullable: true })
  orgContact: string;

  @Column({ nullable: true })
  orgEmail: string;

  @Column({ nullable: true })
  associatedSince: string;

  @Column({ nullable: true })
  contact: string;

  @Column({ nullable: true })
  orgLogo: string;

  @Column({ nullable: true })
  profileImage: string;

  @Column({ nullable: true })
  associatedTill: string;

  @Column({ nullable: true })
  emergencyContact: string;

  @Column({ nullable: true })
  unitAssociatedWith: string;
}
