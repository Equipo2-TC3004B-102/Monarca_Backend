/**
 * FileName: approval-level.entity.ts
 * Description: TypeORM entity representing the approval level table.
 *              This entity defines the structure of approval levels, including their order, applicable amount ranges, and relationships with companies, approval level actors and request approvals.
 * Authors: Debug Studio Team
 * Last Modification made:
 * 15/04/2026 [Julio Rodríguez] Created the ApprovalLevel entity to represent approval level data and its relationships with companies, approval level actors and request approvals.
 */

import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    OneToMany,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { Company } from 'src/companies/entity/company.entity';
import { ApprovalLevelActor } from './approval-level-actor.entity';
import { RequestApproval } from './request-approval.entity';

@Entity({ name: 'approval_levels' })
export class ApprovalLevel {
    @PrimaryGeneratedColumn('uuid', { name: 'id' })
    id: string;

    @Column({ name: 'code' })
    code: string;

    @Column({ name: 'name' })
    name: string;

    @Column({ name: 'company_id', type: 'uuid' })
    company_id: string;

    @Column({ name: 'description', nullable: true })
    description: string;

    @Column({ name: 'applies_to', default: 'travel' })
    applies_to: string;

    @Column({ name: 'level_order', type: 'integer' })
    level_order: number;

    // Minimal and maximum amount for assigning the correct approval level.
    @Column({ name: 'min_amount_mon', type: 'decimal', scale: 2, nullable: true}) // Scale allows for 2 decimal places, suitable for currency values
    min_amount_mon: number;

    @Column({ name: 'max_amount_mon', type: 'decimal', scale: 2, nullable: true}) // Scale allows for 2 decimal places, suitable for currency values
    max_amount_mon: number;

    // Number of approvals required for this level.
    @Column({ name: 'required_approvals', type: 'integer', default: 1 })
    required_approvals: number;

    @Column({ name: 'escalation_hours', type: 'integer', nullable: true })
    escalation_hours: number;

    @Column({ name: 'is_active', default: true })
    is_active: boolean;

    // Relationships

    // Many approval levels can belong to one company.
    @ManyToOne(() => Company, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'company_id' })
    company: Company;

    // One approval level can have many approval level actors associated with it.
    @OneToMany(() => ApprovalLevelActor, (actor) => actor.approval_level)
    approval_level_actors: ApprovalLevelActor[];

    // One approval level can have many request approvals associated with it.
    @OneToMany(
        () => RequestApproval,
        (requestApproval) => requestApproval.approval_level,
    )
    request_approvals: RequestApproval[];

}
