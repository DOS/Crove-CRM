import { NestFactory } from '@nestjs/core';
import { AppModule } from 'src/app.module';
import { UpgradeSequenceReaderService } from 'src/engine/core-modules/upgrade/services/upgrade-sequence-reader.service';
import { DataSource } from 'typeorm';

async function fixMigrationTimestamps() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  const sequenceReader = app.get(UpgradeSequenceReaderService);
  const dataSource = app.get(DataSource);

  const sequence = sequenceReader.getUpgradeSequence();
  console.log(`Loaded ${sequence.length} upgrade steps in total.`);

  const baseEpoch = 1700000000;

  for (let i = 0; i < sequence.length; i++) {
    const step = sequence[i];
    const timestamp = new Date((baseEpoch + i * 60) * 1000).toISOString();

    await dataSource.query(
      `UPDATE core."upgradeMigration" SET "createdAt" = $1 WHERE name = $2`,
      [timestamp, step.name],
    );
  }

  console.log('Successfully aligned all upgradeMigration createdAt timestamps to canonical sequence order!');
  await app.close();
  process.exit(0);
}

fixMigrationTimestamps().catch((err) => {
  console.error('Error fixing timestamps:', err);
  process.exit(1);
});
