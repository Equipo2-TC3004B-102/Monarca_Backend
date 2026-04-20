/*
 * FileName: request-approval.entity.ts
 * Description: TypeORM entity representing the request approval table.
 *              This entity defines the structure of request approvals, including their status, associated approval levels, and relationships with requests and approvers.
 * Authors: Debug Studio Team
 * Last Modification made:
 * 16/04/2026 [Julio Rodríguez] Created the RequestApproval entity to represent the approval status of requests, including their associated approval levels and approvers.
 */

import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { Request } from 'src/requests/entities/request.entity';
import { ApprovalLevel } from './approval-level.entity';
import { ApprovalLevelActor } from './approval-level-actor.entity';
import { User } from 'src/users/entities/user.entity';

@Entity({ name: 'request_approvals' })
export class RequestApproval {
    @PrimaryGeneratedColumn('uuid', { name: 'id' })
    id: string;

    @Column({ name: 'request_id', type: 'uuid', nullable: false })
    request_id: string;

    @Column({ name: 'approval_level_id', type: 'uuid', nullable: false })
    approval_level_id: string;

    @Column({ name: 'approval_actor_id', type: 'uuid', nullable: true })
    approval_actor_id: string;

    @Column({ name: 'approver_user_id', type: 'uuid', nullable: false })
    approver_user_id: string;

    @Column({ name: 'descision', type: 'varchar'})
    decision: string;
    
    @Column({ name: 'comments', type: 'text', nullable: true })
    comments: string;

    @Column({ name: 'amount_snapshot', type: 'decimal', scale: 2 })
    amount_snapshot: number;

    @Column({ name: 'currency_snapshot', type: 'varchar' })
    currency_snapshot: string;

    @Column({ name: 'status', type: 'varchar', default: 'PENDING' })
    status: string;

    @Column({ name: 'escalation_step', type: 'integer', default: 0 })
    escalation_step: number;

    @Column({ name: 'decided_at', type: 'timestamp', nullable: true })
    decided_at: Date;

    // Relationships

    // Many approvals can belong to one request.
    @ManyToOne(() => Request, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'request_id' })
    request: Request;

    // Many approvals can belong to one approval level.
    @ManyToOne(() => ApprovalLevel, (approvalLevel) => approvalLevel.request_approvals, {
        onDelete: 'RESTRICT',
    })
    @JoinColumn({ name: 'approval_level_id' })
    approval_level: ApprovalLevel;

    // Many approvals can be associated with one approval actor rule.
    @ManyToOne(() => ApprovalLevelActor, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'approval_actor_id' })
    approval_actor: ApprovalLevelActor;

    // Many approvals can be associated with one approver user.
    @ManyToOne(() => User, { onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'approver_user_id' })
    approver_user: User;


}