import { Column, Entity, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Enrollment {
  @PrimaryColumn()
  Id: string;

  @Column({ nullable: true })
  ref_id: string;

  @Column({ nullable: true })
  name: string;

  @Column({ nullable: true })
  fname: string;

  @Column({ nullable: true })
  mname: string;

  @Column({ nullable: true })
  gname: string;

  @Column({ nullable: true })
  age: string;

  @Column({ nullable: true })
  class: string;

  @Column({ nullable: true })
  gender: string;

  @Column({ nullable: true })
  mobile: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  aadhaar_id: string;

  @Column({ nullable: true })
  alt_id_type: string;

  @Column({ nullable: true })
  alt_id: string;

  @Column({ nullable: true })
  district_id: string;

  @Column({ nullable: true })
  block_id: string;

  @Column({ nullable: true })
  village_id: string;

  @Column({ nullable: true })
  school_id: string;

  @Column({ nullable: true })
  status: string;
  
  @Column({ nullable: true })
  enrolled_on: string;
}
