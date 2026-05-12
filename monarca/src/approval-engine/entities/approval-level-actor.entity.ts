/**
 * FileName: approval-level-actor.entity.ts
 * Description: TypeORM entity representing the approval level actor table.
 *              This entity defines the relationship between approval levels and their actors, including the actor type, whether their approval is required, and any applicable cost center filters.
 * Authors: Debug Studio Team
 * Last Modification made:
 * 04/05/2026 [Julio Rodríguez] Changed ceco_id type from uuid to varchar (cost_centers pk is now varchar).
 */

import { ApiProperty } from '@nestjs/swagger';
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
    @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
    @PrimaryGeneratedColumn('uuid', { name: 'id' })
    id: string;

    @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
    @Column({ name: 'approval_level_id', type: 'uuid' })
    approval_level_id: string;

    @ApiProperty({ example: 'MANAGER' })
    @Column({ name: 'actor_type', type: 'varchar' })
    actor_type: string;

    @ApiProperty({ example: 'USER', required: false, nullable: true })
    @Column({ name: 'target_type', type: 'varchar', nullable: true })
    target_type: string | null;

    @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', required: false, nullable: true })
    @Column({ name: 'target_id', type: 'uuid', nullable: true })
    target_id: string | null;

    @ApiProperty({ example: true })
    @Column({ name: 'is_required', type: 'boolean', default: true })
    is_required: boolean;

    @ApiProperty({ example: 1, required: false, nullable: true })
    @Column({ name: 'required_count', type: 'integer', nullable: true })
    required_count: number | null;

    @ApiProperty({ example: 'any' })
    @Column({ name: 'selection_mode', type: 'varchar', default: 'any' })
    selection_mode: string;

    @ApiProperty({ example: 'TECH-MX', required: false, nullable: true })
    @Column({ name: 'ceco_id', type: 'varchar', nullable: true })
    ceco_id: string | null;

    @ApiProperty({ example: 0 })
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
    request_approvals: RequestApproval[];
}
