/**
 * FileName: company.entity.ts
 * Description: TypeORM entity representing the companies table. A company
 *              can have many employees associated to it.
 * Authors: Debug Studio Team
 * Last Modification made:
 * 15/04/2026 [Julio Rodríguez] Removed unresolved ApprovalLevel relation to keep the Companies module compilable while approval-level entities are implemented.
 * 19/05/2026 [Julio Rodriguez] Added voucher_deadline_days to configure per-company expense submission window.
 */

import { ApiProperty } from '@nestjs/swagger';
import { User } from 'src/users/entities/user.entity';
import { CostCenter } from 'src/cost-centers/entity/cost-centers.entity';
import { Request } from 'src/requests/entities/request.entity';
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';

@Entity({ name: 'companies' })
export class Company {
    @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ApiProperty({ example: 'Ditta Consulting' })
    @Column()
    name: string;

    @ApiProperty({ example: 'MXN' })
    @Column()
    local_currency: string;

    @ApiProperty({ example: 7 })
    @Column({ name: 'voucher_deadline_days', type: 'integer', default: 7 })
    voucher_deadline_days: number;

    // One company can have many employees
    @OneToMany(() => User, (user) => user.company)
    employees: User[];

    // One company can have many cost centers
    @OneToMany(() => CostCenter, (costCenter) => costCenter.company)
    cost_centers: CostCenter[];

    // One company can have many requests
    @OneToMany(() => Request, (request) => request.company)
    requests: Request[];

}