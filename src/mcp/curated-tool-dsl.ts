import { assertTrue, toOptionalBoolean, toOptionalNumber, toOptionalString } from './tool-arg-utils';

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
  commandSignature?: string;
  rootCommand?: string;
  tags?: string[];
  docsSummary?: string;
  buildArgv(toolArgs: ToolArgs): string[];
}

interface CuratedMcpCommandToolDefinition {
  name: string;
  title: string;
  description: string;
  inputSchema: CuratedMcpCommandTool['inputSchema'];
  annotations?: CuratedMcpCommandTool['annotations'];
  commandSignature?: string;
  tags?: string[];
  docsSummary?: string;
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

export function defineCuratedTool(definition: CuratedMcpCommandToolDefinition): CuratedMcpCommandTool {
  const commandSignature = definition.commandSignature || inferCommandSignature(definition.baseArgv);
  return {
    name: definition.name,
    title: definition.title,
    description: definition.description,
    inputSchema: definition.inputSchema,
    annotations: definition.annotations,
    commandSignature,
    rootCommand: commandSignature?.split(/\s+/)[0],
    tags: definition.tags ? [...definition.tags] : [],
    docsSummary: definition.docsSummary,
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
