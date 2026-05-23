/**
 * FileName: 1781000000004-AddIdCecoToRequests.ts
 * Description: Migration to add id_ceco column to requests table and configure its FK.
 * Authors: Diego (A01420632)
 * Last Modification made: 20/05/2026
 */

import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey } from 'typeorm';

export class AddIdCecoToRequests1781000000004 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'requests',
      new TableColumn({
        name: 'id_ceco',
        type: 'varchar',
        isNullable: true,
      }),
    );

    await queryRunner.createForeignKey(
      'requests',
      new TableForeignKey({
        columnNames: ['id_ceco'],
        referencedColumnNames: ['id'],
        referencedTableName: 'cost_centers',
        onDelete: 'SET NULL',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('requests');
    if (table) {
      const foreignKey = table.foreignKeys.find(
        (fk) => fk.columnNames.indexOf('id_ceco') !== -1,
      );
      if (foreignKey) {
        await queryRunner.dropForeignKey('requests', foreignKey);
      }
    }
    await queryRunner.dropColumn('requests', 'id_ceco');
  }
}
