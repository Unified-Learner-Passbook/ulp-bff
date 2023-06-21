import { Column, Entity, PrimaryColumn, PrimaryGeneratedColumn } from "typeorm";

@Entity()

export class Benefit {

    @PrimaryColumn()
    Id: string;

    @Column({ nullable: true })
    ref_id: string;

    @Column({ nullable: true })
    name: string;

    @Column({ nullable: true })
    class: string;

    @Column({ nullable: true })
    aadhaar_id: string;

    @Column({ nullable: true })
    alt_id_type: string;

    @Column({ nullable: true })
    alt_id: string;

    @Column({ nullable: true })
    school_id: string;

    @Column({ nullable: true })
    scheme_id: string

    @Column({ nullable: true })
    scheme_name: string

    @Column({ nullable: true })
    transaction_id: string;

    @Column({ nullable: true })
    account_details: string;
    
    @Column({ nullable: true })
    transaction_amount: string;
    
}