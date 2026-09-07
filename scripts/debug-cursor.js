const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('./dist/app.module');
const { UpgradeSequenceReaderService } = require('./dist/engine/core-modules/upgrade/services/upgrade-sequence-reader.service');
const { UpgradeMigrationService } = require('./dist/engine/core-modules/upgrade/services/upgrade-migration.service');

async function debugCursor() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: false,
  });

  const sequenceReader = app.get(UpgradeSequenceReaderService);
  const migrationService = app.get(UpgradeMigrationService);

  const sequence = sequenceReader.getUpgradeSequence();
  console.log('Total sequence length:', sequence.length);

  const lastAttempted = await migrationService.getLastAttemptedInstanceCommand();
  console.log('Last attempted instance command:', lastAttempted);

  if (lastAttempted) {
    const index = sequence.findIndex(s => s.name === lastAttempted.name);
    console.log(`Index of ${lastAttempted.name}:`, index);
    const nextCursor = lastAttempted.status === 'completed' ? index + 1 : index;
    console.log('Computed nextCursor:', nextCursor);
  }

  console.log('Step at index 248:', sequence[248]);
  console.log('Step at index 249:', sequence[249]);
  console.log('Step at index 250:', sequence[250]);

  // Let's list all instance commands in the sequence that are >= 249
  const remainingInstanceSteps = sequence
    .map((s, idx) => ({ ...s, idx }))
    .filter(s => s.idx >= 248 && (s.kind === 'fast-instance' || s.kind === 'slow-instance'));
  console.log('Remaining instance steps >= 248:', remainingInstanceSteps.map(s => ({ idx: s.idx, name: s.name, kind: s.kind })));

  await app.close();
  process.exit(0);
}

debugCursor().catch(err => {
  console.error(err);
  process.exit(1);
});
