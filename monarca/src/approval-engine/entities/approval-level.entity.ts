/**
 * FileName: approval-level.entity.ts
 * Description: TypeORM entity representing the approval level table.
 *              This entity defines the structure of approval levels, including their order, applicable amount ranges, and relationships with companies, approval level actors and request approvals.
 * Authors: Debug Studio Team
 * Last Modification made:
 * 23/04/2026 [Julio Rodríguez] Added @ApiProperty to all fields for Swagger documentation.
 */

import { ApiProperty } from '@nestjs/swagger';
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
    @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
    @PrimaryGeneratedColumn('uuid', { name: 'id' })
    id: string;

    @ApiProperty({ example: 'L1' })
    @Column({ name: 'code' })
    code: string;

    @ApiProperty({ example: 'Manager Approval' })
    @Column({ name: 'name' })
    name: string;

    @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', nullable: true })
    @Column({ name: 'company_id', type: 'uuid', nullable: true })
    company_id: string | null;

    @ApiProperty({ example: 'Requires manager approval for amounts above $10,000 MXN', required: false, nullable: true })
    @Column({ name: 'description', type: 'varchar', nullable: true })
    description: string | null;

    @ApiProperty({ example: 'travel' })
    @Column({ name: 'applies_to', default: 'travel' })
    applies_to: string;

    @ApiProperty({ example: 1 })
    @Column({ name: 'level_order', type: 'integer' })
    level_order: number;

    @ApiProperty({ example: 10000, required: false, nullable: true })
    @Column({ name: 'min_amount_mon', type: 'decimal', scale: 2, nullable: true })
    min_amount_mon: number | null;

    @ApiProperty({ example: 50000, required: false, nullable: true })
    @Column({ name: 'max_amount_mon', type: 'decimal', scale: 2, nullable: true })
    max_amount_mon: number | null;

    @ApiProperty({ example: 1 })
    @Column({ name: 'required_approvals', type: 'integer', default: 1 })
    required_approvals: number;

    @ApiProperty({ example: 24, required: false, nullable: true })
    @Column({ name: 'escalation_hours', type: 'integer', nullable: true })
    escalation_hours: number | null;

    @ApiProperty({ example: true })
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
