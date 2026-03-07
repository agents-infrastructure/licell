import { checkAllGeneratedDocs } from '../src/utils/docs-pipeline';

try {
  const results = checkAllGeneratedDocs();
  const dirty = results.filter((result) => result.updated);

  if (dirty.length === 0) {
    console.log(`generated docs are in sync (${results.length} targets)`);
    process.exit(0);
  }

  console.error('generated docs are out of sync:');
  for (const result of dirty) {
    console.error(`- ${result.filePath}`);
  }
  console.error('run `bun run docs:sync` and commit the updated files.');
  process.exit(1);
} catch (error) {
  console.error(error instanceof Error ? error.stack || error.message : String(error));
  process.exit(1);
}
