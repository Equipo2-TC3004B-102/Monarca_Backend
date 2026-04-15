/**
 * FileName: company.entity.ts
 * Description: TypeORM entity representing the companies table. A company
 *              can have many employees associated to it.
 * Authors: Debug Studio Team
 * Last Modification made:
 * 14/04/2026 [Julio Rodríguez] Created the Company entity to represent company data and its relationships with employees.
 * 15/04/2026 [Julio Rodríguez] Removed unresolved ApprovalLevel relation to keep the Companies module compilable while approval-level entities are implemented.
 */

import { User } from 'src/users/entities/user.entity';
import { CostCenter } from 'src/cost-centers/entity/cost-centers.entity';
import { Request } from 'src/requests/entities/request.entity';
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

    // One company can have many requests
    @OneToMany(() => Request, (request) => request.company)
    requests: Request[];

}