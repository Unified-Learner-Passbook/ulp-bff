import { Column, Entity, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Assesment {
  @PrimaryColumn()
  Id: string;

  @Column({ nullable: true })
  ref_id: string;

  @Column({ nullable: true })
  name: string;

  @Column({ nullable: true })
  aadhaar_id: string;

  @Column({ nullable: true })
  alt_id_type: string;

  @Column({ nullable: true })
  alt_id: string;

  @Column({ nullable: true })
  school_id: string;

  @Column({ nullable: true })
  class: string;

  @Column({ nullable: true })
  assesment_id: string;

  @Column({ nullable: true })
  examiner_id: string;

  @Column({ nullable: true })
  evaluator_id: string;

  @Column({ nullable: true })
  marks: string;

  @Column({ nullable: true })
  signatory: string;

  @Column({ nullable: true })
  age: string;
}
