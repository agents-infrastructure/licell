import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname } from 'path';

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function syncGeneratedSection(content: string, options: {
  startMarker: string;
  endMarker: string;
  generatedContent: string;
  missingMarkersMessage: string;
}) {
  const { startMarker, endMarker, generatedContent, missingMarkersMessage } = options;
  if (!content.includes(startMarker) || !content.includes(endMarker)) {
    throw new Error(missingMarkersMessage);
  }

  const pattern = new RegExp(`${escapeRegExp(startMarker)}[\\s\\S]*?${escapeRegExp(endMarker)}`);
  return content.replace(
    pattern,
    `${startMarker}\n${generatedContent.trimEnd()}\n${endMarker}`
  );
}

export function normalizeTextFileContent(content: string) {
  return content.endsWith('\n') ? content : `${content}\n`;
}

export function syncTextFile(filePath: string, nextContent: string) {
  const normalized = normalizeTextFileContent(nextContent);
  const current = existsSync(filePath) ? readFileSync(filePath, 'utf8') : '';
  const updated = current !== normalized;

  if (updated) {
    mkdirSync(dirname(filePath), { recursive: true });
    writeFileSync(filePath, normalized, 'utf8');
  }

  return { updated, filePath };
}
