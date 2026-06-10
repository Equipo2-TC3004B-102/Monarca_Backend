/**
 * FileName: request-approval.entity.ts
 * Description: TypeORM entity representing the request approval table.
 *              This entity defines the structure of request approvals, including their status, associated approval levels, and relationships with requests and approvers.
 * Authors: Debug Studio Team
 * Last Modification made:
 * 03/06/2026 [Julio Rodriguez] Restored approval_actor_id and ApprovalLevelActor relation.
 */

import { ApiProperty } from '@nestjs/swagger';
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
    @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
    @PrimaryGeneratedColumn('uuid', { name: 'id' })
    id: string;

    @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
    @Column({ name: 'request_id', type: 'uuid', nullable: false })
    request_id: string;

    @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
    @Column({ name: 'approval_level_id', type: 'uuid', nullable: false })
    approval_level_id: string;

    @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', required: false, nullable: true })
    @Column({ name: 'approval_actor_id', type: 'uuid', nullable: true })
    approval_actor_id: string | null;

    @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
    @Column({ name: 'approver_user_id', type: 'uuid', nullable: false })
    approver_user_id: string;

    @ApiProperty({ example: 'APPROVED' })
    @Column({ name: 'decision', type: 'varchar' })
    decision: string;

    @ApiProperty({ example: 'Approved with conditions', required: false, nullable: true })
    @Column({ name: 'comments', type: 'text', nullable: true })
    comments: string | null;

    @ApiProperty({ example: 15000.00 })
    @Column({ name: 'amount_snapshot', type: 'decimal', scale: 2 })
    amount_snapshot: number;

    @ApiProperty({ example: 'MXN' })
    @Column({ name: 'currency_snapshot', type: 'varchar' })
    currency_snapshot: string;

    @ApiProperty({ example: 'PENDING' })
    @Column({ name: 'status', type: 'varchar', default: 'PENDING' })
    status: string;

    @ApiProperty({ example: 0 })
    @Column({ name: 'escalation_step', type: 'integer', default: 0 })
    escalation_step: number;

    @ApiProperty({ example: '2026-04-23T12:00:00Z', required: false, nullable: true })
    @Column({ name: 'decided_at', type: 'timestamp', nullable: true })
    decided_at: Date | null;

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
