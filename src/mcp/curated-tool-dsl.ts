import type { CommandTaskHint } from '../utils/command-metadata';
import {
  buildLicellMcpToolAnnotations,
  buildLicellMcpToolMetadata,
  buildLicellMcpToolMetadataFromAgentCommand,
  findAgentCommandForTool,
  renderLicellMcpToolDescription,
  resolveLicellMcpToolTitle,
  type LicellMcpToolMetadataEnvelope,
  type LicellMcpToolPreferredOutput
} from './tool-metadata';
import { assertTrue, toOptionalBoolean, toOptionalNumber, toOptionalString } from './tool-arg-utils';
import {
  resolveLicellWorkflowEntryCopy,
  type LicellWorkflowRole
} from './workflow-descriptors';

export type ToolArgs = Record<string, unknown>;
export type CuratedSchemaProperty = Record<string, unknown>;
export type CuratedToolValidator = (toolArgs: ToolArgs) => void;
export type CuratedToolBinding = (toolArgs: ToolArgs, argv: string[]) => void;

export interface CuratedMcpCommandTool {
  name: string;
  title: string;
  description: string;
  inputSchema: {
    type: 'object';
    additionalProperties: false;
    properties: Record<string, CuratedSchemaProperty>;
    required?: string[];
  };
  annotations?: {
    destructiveHint?: boolean;
  };
  metadata?: LicellMcpToolMetadataEnvelope;
  commandSignature?: string;
  rootCommand?: string;
  tags?: string[];
  buildArgv(toolArgs: ToolArgs): string[];
}

interface CuratedMcpCommandToolDefinition {
  name: string;
  title?: string;
  summary?: string;
  description?: string;
  inputSchema: CuratedMcpCommandTool['inputSchema'];
  annotations?: CuratedMcpCommandTool['annotations'];
  commandSignature?: string;
  tags?: string[];
  workflowRoleByTag?: Record<string, LicellWorkflowRole>;
  preferredOutput?: LicellMcpToolPreferredOutput;
  supportsStructuredOutput?: boolean;
  taskHints?: CommandTaskHint[];
  baseArgv: string[] | ((toolArgs: ToolArgs) => string[]);
  validators?: CuratedToolValidator[];
  bindings?: CuratedToolBinding[];
}

const DEFAULT_CWD_DESCRIPTION = 'Working directory relative to projectRoot (default: projectRoot).';
const DEFAULT_TIMEOUT_DESCRIPTION = 'Command timeout in milliseconds.';

export function stringProp(description: string, extra?: Record<string, unknown>): CuratedSchemaProperty {
  return { type: 'string', description, ...(extra || {}) };
}

export function numberProp(description: string, extra?: Record<string, unknown>): CuratedSchemaProperty {
  return { type: 'number', description, ...(extra || {}) };
}

export function booleanProp(description: string, extra?: Record<string, unknown>): CuratedSchemaProperty {
  return { type: 'boolean', description, ...(extra || {}) };
}

export function objectProp(description: string, extra?: Record<string, unknown>): CuratedSchemaProperty {
  return { type: 'object', description, ...(extra || {}) };
}

export function stringEnumProp(description: string, values: string[], extra?: Record<string, unknown>): CuratedSchemaProperty {
  return { type: 'string', enum: values, description, ...(extra || {}) };
}

export function inputSchema(
  properties: Record<string, CuratedSchemaProperty>,
  required?: string[]
): CuratedMcpCommandTool['inputSchema'] {
  return {
    type: 'object',
    additionalProperties: false,
    properties,
    ...(required && required.length > 0 ? { required } : {})
  };
}

export function withExecutionProps(
  properties: Record<string, CuratedSchemaProperty>,
  options?: { timeoutDescription?: string }
) {
  return {
    ...properties,
    cwd: stringProp(DEFAULT_CWD_DESCRIPTION),
    timeoutMs: numberProp(options?.timeoutDescription || DEFAULT_TIMEOUT_DESCRIPTION)
  };
}

function inferCommandSignature(baseArgv: CuratedMcpCommandToolDefinition['baseArgv']) {
  if (typeof baseArgv === 'function') return undefined;
  const tokens: string[] = [];
  for (const token of baseArgv) {
    if (token.startsWith('-')) break;
    tokens.push(token);
  }
  return tokens.length > 0 ? tokens.join(' ') : undefined;
}

function resolveDefinitionDescription(
  definition: CuratedMcpCommandToolDefinition,
  matchedCommand?: ReturnType<typeof findAgentCommandForTool>
) {
  const workflowEntryCopy = resolveLicellWorkflowEntryCopy(definition.tags, definition.workflowRoleByTag);
  return definition.description
    || workflowEntryCopy?.description
    || matchedCommand?.description
    || matchedCommand?.summary
    || definition.summary;
}

function resolveDefinitionSummary(
  definition: CuratedMcpCommandToolDefinition,
  matchedCommand?: ReturnType<typeof findAgentCommandForTool>
) {
  const workflowEntryCopy = resolveLicellWorkflowEntryCopy(definition.tags, definition.workflowRoleByTag);
  return definition.summary
    || workflowEntryCopy?.summary
    || matchedCommand?.summary
    || definition.description
    || workflowEntryCopy?.description;
}

function buildFallbackCuratedTaskHints(
  definition: CuratedMcpCommandToolDefinition,
  commandSignature?: string,
  fallbackDescription?: string
): CommandTaskHint[] {
  return [{
    phase: definition.annotations?.destructiveHint ? 'cleanup' : 'mutate',
    title: definition.title || definition.name,
    description: fallbackDescription || definition.summary || definition.title || definition.name,
    commands: [commandSignature || definition.name]
  }];
}

function buildCuratedToolMetadata(definition: CuratedMcpCommandToolDefinition, commandSignature?: string) {
  const rootCommand = commandSignature?.split(/\s+/)[0];
  const matchedCommand = findAgentCommandForTool(commandSignature, rootCommand);
  const summary = resolveDefinitionSummary(definition, matchedCommand);
  const description = resolveDefinitionDescription(definition, matchedCommand) || summary || definition.name;

  if (matchedCommand && !(definition.taskHints && definition.taskHints.length > 0)) {
    return buildLicellMcpToolMetadataFromAgentCommand(matchedCommand, {
      toolKind: 'curated',
      preferredOutput: definition.preferredOutput || 'json',
      supportsStructuredOutput: definition.supportsStructuredOutput !== false,
      tags: definition.tags,
      commandSignature,
      title: definition.title,
      summary,
      description,
      workflowRoleByTag: definition.workflowRoleByTag
    });
  }

  return buildLicellMcpToolMetadata({
    toolKind: 'curated',
    preferredOutput: definition.preferredOutput || 'json',
    supportsStructuredOutput: definition.supportsStructuredOutput !== false,
    title: definition.title,
    summary,
    description,
    command: {
      key: matchedCommand?.key,
      signature: commandSignature,
      rootCommand: matchedCommand?.rootCommand || rootCommand
    },
    section: matchedCommand?.sectionId && matchedCommand.sectionTitle
      ? { id: matchedCommand.sectionId, title: matchedCommand.sectionTitle }
      : undefined,
    tags: [...(definition.tags || []), ...(rootCommand ? [rootCommand] : [])],
    workflowRoleByTag: definition.workflowRoleByTag,
    taskHints: definition.taskHints || buildFallbackCuratedTaskHints(definition, commandSignature, description),
    safety: matchedCommand?.safety,
    result: matchedCommand?.result
  });
}

export function defineCuratedTool(definition: CuratedMcpCommandToolDefinition): CuratedMcpCommandTool {
  const commandSignature = definition.commandSignature || inferCommandSignature(definition.baseArgv);
  const metadata = buildCuratedToolMetadata(definition, commandSignature);
  return {
    name: definition.name,
    title: resolveLicellMcpToolTitle(metadata, definition.title),
    description: renderLicellMcpToolDescription(metadata, {
      fallbackSummary: definition.summary,
      fallbackDescription: definition.description
    }),
    inputSchema: definition.inputSchema,
    annotations: buildLicellMcpToolAnnotations({ metadata, fallback: definition.annotations }),
    metadata,
    commandSignature,
    rootCommand: commandSignature?.split(/\s+/)[0],
    tags: definition.tags ? [...definition.tags] : [],
    buildArgv(toolArgs: ToolArgs) {
      for (const validator of definition.validators || []) validator(toolArgs);
      const argv = typeof definition.baseArgv === 'function'
        ? [...definition.baseArgv(toolArgs)]
        : [...definition.baseArgv];
      for (const binding of definition.bindings || []) binding(toolArgs, argv);
      return argv;
    }
  };
}

export function buildCuratedToolMap(tools: CuratedMcpCommandTool[]): Record<string, CuratedMcpCommandTool> {
  return Object.fromEntries(tools.map((tool) => [tool.name, tool]));
}

export function requireString(toolArgs: ToolArgs, inputName: string, message = `${inputName} is required`) {
  const value = toOptionalString(toolArgs[inputName]);
  if (!value) throw new Error(message);
  return value;
}

export function requireEnum(
  toolArgs: ToolArgs,
  inputName: string,
  allowedValues: string[],
  message = `${inputName} must be one of: ${allowedValues.join(', ')}`
) {
  const value = toOptionalString(toolArgs[inputName]);
  if (!value || !allowedValues.includes(value)) throw new Error(message);
  return value;
}

export function optionalStringFlag(inputName: string, flag: string): CuratedToolBinding {
  return (toolArgs, argv) => {
    const value = toOptionalString(toolArgs[inputName]);
    if (value) argv.push(flag, value);
  };
}

export function optionalNumberFlag(inputName: string, flag: string): CuratedToolBinding {
  return (toolArgs, argv) => {
    const value = toOptionalNumber(toolArgs[inputName]);
    if (value !== undefined) argv.push(flag, String(value));
  };
}

export function optionalBooleanFlag(inputName: string, flag: string): CuratedToolBinding {
  return (toolArgs, argv) => {
    if (toOptionalBoolean(toolArgs[inputName])) argv.push(flag);
  };
}

export function requiredPositionalString(inputName: string, message?: string): CuratedToolBinding {
  return (toolArgs, argv) => {
    argv.push(requireString(toolArgs, inputName, message));
  };
}

export function requiredStringFlag(inputName: string, flag: string, message?: string): CuratedToolBinding {
  return (toolArgs, argv) => {
    argv.push(flag, requireString(toolArgs, inputName, message));
  };
}

export function optionalPositionalString(inputName: string): CuratedToolBinding {
  return (toolArgs, argv) => {
    const value = toOptionalString(toolArgs[inputName]);
    if (value) argv.push(value);
  };
}

export function defaultTrueFlag(inputName: string, flag: string): CuratedToolBinding {
  return (toolArgs, argv) => {
    if (toOptionalBoolean(toolArgs[inputName]) !== false) argv.push(flag);
  };
}

export function literalTokens(...tokens: string[]): CuratedToolBinding {
  return (_toolArgs, argv) => {
    argv.push(...tokens);
  };
}

export function whenBooleanTrue(inputName: string, binding: CuratedToolBinding): CuratedToolBinding {
  return (toolArgs, argv) => {
    if (!toOptionalBoolean(toolArgs[inputName])) return;
    binding(toolArgs, argv);
  };
}

export function optionalJsonFlag(inputName: string, flag: string): CuratedToolBinding {
  return (toolArgs, argv) => {
    if (toolArgs[inputName] !== undefined) argv.push(flag, JSON.stringify(toolArgs[inputName]));
  };
}

export function customBinding(binding: CuratedToolBinding) {
  return binding;
}

export function customValidator(validator: CuratedToolValidator) {
  return validator;
}

export function requireTrueValidator(inputName: string, message: string): CuratedToolValidator {
  return (toolArgs) => {
    assertTrue(toOptionalBoolean(toolArgs[inputName]), message);
  };
}

export function requireTrueWhenBoolean(conditionInputName: string, confirmInputName: string, message: string): CuratedToolValidator {
  return (toolArgs) => {
    if (!toOptionalBoolean(toolArgs[conditionInputName])) return;
    assertTrue(toOptionalBoolean(toolArgs[confirmInputName]), message);
  };
}

export function atLeastOnePresentValidator(inputNames: string[], message: string): CuratedToolValidator {
  return (toolArgs) => {
    const hasAny = inputNames.some((inputName) => {
      const value = toolArgs[inputName];
      if (typeof value === 'string') return value.trim().length > 0;
      return value !== undefined && value !== null;
    });
    if (!hasAny) throw new Error(message);
  };
}

export function mutuallyExclusiveValidator(inputNames: string[], message: string): CuratedToolValidator {
  return (toolArgs) => {
    const present = inputNames.filter((inputName) => {
      const value = toolArgs[inputName];
      if (typeof value === 'string') return value.trim().length > 0;
      return value !== undefined && value !== null;
    });
    if (present.length > 1) throw new Error(message);
  };
}
