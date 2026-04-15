/**
 * FileName: company.entity.ts
 * Description: TypeORM entity representing the companies table. A company
 *              can have many employees associated to it.
 * Authors: Debug Studio Team
 * Last Modification made:
 * 14/04/2026 [Julio Rodríguez] Created the Company entity to represent company data and its relationships with employees.
 */

import { User } from 'src/users/entities/user.entity';
import { CostCenter } from 'src/cost-centers/entity/cost-centers.entity';
import { ApprovalLevel } from 'src/approval-levels/entity/approval-levels.entity'; // Non exixtsing table
import { Request } from 'src/requests/entity/request.entity'; // Non existing table 
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';

@Entity({ name: 'companies' })
export class Company {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column()
    local_currency: string;

    // One company can have many employees
    @OneToMany(() => User, (user) => user.company)
    employees: User[];

    // One company can have many cost centers
    @OneToMany(() => CostCenter, (costCenter) => costCenter.company)
    cost_centers: CostCenter[];

    //One compamny can have many approval levels
    @OneToMany(() => ApprovalLevel, (approvalLevel) => approvalLevel.company)
    approval_levels: ApprovalLevel[];

    // One company can have many requests
    @OneToMany(() => Request, (request) => request.company)
    requests: Request[];

}