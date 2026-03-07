import { syncAllGeneratedDocs } from '../src/utils/docs-pipeline';

try {
  const results = syncAllGeneratedDocs();

  for (const result of results) {
    const label = result.updated ? 'updated' : 'already up to date';
    console.log(`${label}: ${result.filePath}`);
  }
} catch (error) {
  console.error(error instanceof Error ? error.stack || error.message : String(error));
  process.exit(1);
}
