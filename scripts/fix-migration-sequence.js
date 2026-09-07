const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('./dist/app.module');
const { UpgradeSequenceReaderService } = require('./dist/engine/core-modules/upgrade/services/upgrade-sequence-reader.service');
const { DataSource } = require('typeorm');

async function fixMigrationTimestamps() {
  console.log('Initializing application context...');
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: false,
  });

  const sequenceReader = app.get(UpgradeSequenceReaderService);
  const dataSource = app.get(DataSource);

  const sequence = sequenceReader.getUpgradeSequence();
  console.log(`Loaded ${sequence.length} upgrade steps in total.`);

  // Base date: 2025-01-01 00:00:00 UTC (1735689600)
  // Each step is 1 hour apart, so 2.38.0 will strictly be latest!
  const baseEpoch = 1735689600;

  for (let i = 0; i < sequence.length; i++) {
    const step = sequence[i];
    const timestamp = new Date((baseEpoch + i * 3600) * 1000).toISOString();

    await dataSource.query(
      `UPDATE core."upgradeMigration" SET "createdAt" = $1 WHERE name = $2`,
      [timestamp, step.name],
    );
  }

  // Also clean up any failed status for completed steps
  console.log('Cleaning up duplicate failed migration records...');
  await dataSource.query(`
    DELETE FROM core."upgradeMigration" 
    WHERE status = 'failed' 
    AND name IN (
      SELECT name FROM core."upgradeMigration" WHERE status = 'completed'
    );
  `);

  console.log('✅ Successfully aligned all upgradeMigration createdAt timestamps!');
  await app.close();
  process.exit(0);
}

fixMigrationTimestamps().catch((err) => {
  console.error('Error fixing timestamps:', err);
  process.exit(1);
});
