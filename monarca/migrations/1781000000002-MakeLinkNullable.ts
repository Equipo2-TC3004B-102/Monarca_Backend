import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class MakeLinkNullable1781000000002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.changeColumn(
      'reservations',
      'link',
      new TableColumn({
        name: 'link',
        type: 'varchar',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.changeColumn(
      'reservations',
      'link',
      new TableColumn({
        name: 'link',
        type: 'varchar',
        isNullable: false,
      }),
    );
  }
}
