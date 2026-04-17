/*
 * FileName: approval-level-actor.entity.ts
 * Description: TypeORM entity representing the approval level actor table.
 *              This entity defines the relationship between approval levels and their actors, including the actor type, whether their approval is required, and any applicable cost center filters.
 * Authors: Debug Studio Team
 * Last Modification made:
 * 16/04/2026 [Julio Rodríguez] Created the ApprovalLevelActor entity to represent the relationship between approval levels and their actors, including the actor type and whether their approval is required.
 */

import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    OneToMany,
} from 'typeorm';
import { CostCenter } from 'src/cost-centers/entity/cost-centers.entity';
import { ApprovalLevel } from './approval-level.entity';
import { RequestApproval } from './request-approval.entity';

@Entity({ name: 'approval_levels_actors' })
export class ApprovalLevelActor {
    @PrimaryGeneratedColumn('uuid', { name: 'id' })
    id: string;

    // Approval level this rule belongs to.
    @Column({ name: 'approval_level_id', type: 'uuid' })
    approval_level_id: string;

    // Type of approver (MANAGER, SOI, TRAVEL AGENCY).
    @Column({ name: 'actor_type', type: 'varchar' })
    actor_type: string;

    // Indicates how target_id should be resolved (USER, ROLE, REQUEST_FIELD, etc.).
    @Column({ name: 'target_type', type: 'varchar', nullable: true })
    target_type: string;

    // Target object id when rule points to a specific approver source.
    @Column({ name: 'target_id', type: 'uuid', nullable: true })
    target_id: string;

    // Indicates whether this actor rule is mandatory.
    @Column({ name: 'is_required', type: 'boolean', default: true })
    is_required: boolean;

    // Minimum number of approvals needed for this actor group (if applicable).
    @Column({ name: 'required_count', type: 'integer', nullable: true })
    required_count: number;

    // Rule evaluation mode (for example: ANY, ALL, COUNT).
    @Column({ name: 'selection_mode', type: 'varchar', default: 'any' })
    selection_mode: string;

    // Optional cost center filter to narrow applicable approvers.
    @Column({ name: 'ceco_id', type: 'uuid', nullable: true })
    ceco_id?: string;

    // Escalation order inside the same approval level.
    @Column({ name: 'escalation_step', type: 'integer', default: 0 })
    escalation_step: number;

    // Relationships

    // Many actors can belong to one approval level.
    @ManyToOne(
        () => ApprovalLevel,
        (approvalLevel) => approvalLevel.approval_level_actors,
        { onDelete: 'CASCADE' },
    )
    @JoinColumn({ name: 'approval_level_id' })
    approval_level: ApprovalLevel;

    // Many actors can be associated with one cost center. This is optional and allows for filtering approvers based on cost center.
    @ManyToOne(() => CostCenter, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'ceco_id' })
    cost_center: CostCenter;

    @OneToMany(() => RequestApproval, (requestApproval) => requestApproval.approval_actor)
    request_approvals-: RequestApproval[];
}