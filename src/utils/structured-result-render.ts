import type { ResolvedCommandResultDescriptor, ResolvedCommandResultFieldTreeNode } from './command-metadata';

export interface StructuredResultRenderOptions {
  baseIndent?: string;
  nestedIndent?: string;
  separator?: string;
  optionalLabel?: string;
  includeEnvelope?: boolean;
  stageDescription?: string;
  outcomeDescription?: string;
}

function hasExactField(result: ResolvedCommandResultDescriptor, name: string) {
  return result.fields.some((field) => field.name === name);
}

function renderFieldTreeLines(
  node: ResolvedCommandResultFieldTreeNode,
  depth: number,
  options: Required<Pick<StructuredResultRenderOptions, 'baseIndent' | 'nestedIndent' | 'separator' | 'optionalLabel'>>
): string[] {
  const optional = node.required === false ? options.optionalLabel : '';
  const description = node.description ? `${options.separator}${node.description}` : '';
  const rendered = [`${options.baseIndent}${options.nestedIndent.repeat(depth)}- \`${node.segment}\`${optional}${description}`];
  for (const child of node.children) {
    rendered.push(...renderFieldTreeLines(child, depth + 1, options));
  }
  return rendered;
}

export function renderStructuredResultLines(
  result: ResolvedCommandResultDescriptor,
  options: StructuredResultRenderOptions = {}
) {
  const baseIndent = options.baseIndent ?? '';
  const nestedIndent = options.nestedIndent ?? '  ';
  const separator = options.separator ?? ' · ';
  const optionalLabel = options.optionalLabel ?? '（optional）';
  const includeEnvelope = options.includeEnvelope !== false;
  const lines: string[] = [];

  if (result.summary) {
    lines.push(`${baseIndent}- ${result.summary}`);
  }

  if (includeEnvelope && !hasExactField(result, 'stage')) {
    lines.push(`${baseIndent}- \`stage\`${separator}${options.stageDescription || '命令阶段标识。'}`);
  }

  if (includeEnvelope && result.outcomeKey && !hasExactField(result, result.outcomeKey)) {
    lines.push(`${baseIndent}- \`${result.outcomeKey}\`${separator}${options.outcomeDescription || '结果布尔态字段。'}`);
  }

  for (const node of result.fieldTree) {
    lines.push(...renderFieldTreeLines(node, 0, {
      baseIndent,
      nestedIndent,
      separator,
      optionalLabel
    }));
  }

  return lines;
}
