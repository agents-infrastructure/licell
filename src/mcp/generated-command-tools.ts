import { buildAgentCommandCatalog, type AgentCommandCatalogEntry } from '../utils/command-reference';
import { canExposeCommandAsGeneratedMcpTool, toGeneratedMcpToolName } from '../utils/command-surface-ids';

interface JsonSchemaProperty {
  type?: 'string' | 'boolean' | 'array' | 'number';
  items?: { type: 'string' };
  description?: string;
}

export interface GeneratedMcpCommandTool {
  name: string;
  title: string;
  description: string;
  inputSchema: {
    type: 'object';
    additionalProperties: false;
    properties: Record<string, JsonSchemaProperty>;
    required?: string[];
  };
  commandKey: string;
  annotations?: {
    destructiveHint?: boolean;
  };
  positionalBindings: Array<{
    inputName: string;
    rawName: string;
    required: boolean;
    variadic: boolean;
  }>;
  optionBindings: Array<{
    inputName: string;
    flag: string;
    rawName: string;
    description: string;
    takesValue: boolean;
    valueRequired: boolean;
    boolean: boolean;
  }>;
}

function unique<T>(values: T[]) {
  return [...new Set(values)];
}

function toCamelCase(value: string) {
  return value
    .trim()
    .replace(/^[^A-Za-z0-9]+/, '')
    .replace(/[^A-Za-z0-9]+(.)/g, (_, char: string) => char.toUpperCase())
    .replace(/^[A-Z]/, (char) => char.toLowerCase());
}

function toPositionalInputName(name: string, reserved: Set<string>) {
  const base = toCamelCase(name) || 'arg';
  if (!reserved.has(base)) {
    reserved.add(base);
    return base;
  }
  const candidate = `arg${base.slice(0, 1).toUpperCase()}${base.slice(1)}`;
  reserved.add(candidate);
  return candidate;
}

function toOptionInputName(flag: string, reserved: Set<string>) {
  const base = toCamelCase(flag.replace(/^--/, '').replace(/^-/, '')) || 'option';
  if (!reserved.has(base)) {
    reserved.add(base);
    return base;
  }

  let index = 2;
  while (reserved.has(`${base}${index}`)) index += 1;
  const candidate = `${base}${index}`;
  reserved.add(candidate);
  return candidate;
}

function toPositionalDescription(rawName: string, required: boolean, variadic: boolean) {
  const traits = [required ? 'required positional argument' : 'optional positional argument'];
  if (variadic) traits.push('variadic');
  return `${traits.join(', ')}: ${rawName}`;
}

function inferDestructive(command: AgentCommandCatalogEntry) {
  if (command.options.some((option) => option.primaryFlag === '--yes')) return true;
  const haystack = `${command.key} ${command.description}`.toLowerCase();
  return /(\brm\b|delete|remove|rollback|prune|cleanup|reset|unbind|destroy|rotate-password|reset-password|删除|清理|解绑|回滚|重置)/i.test(haystack);
}

export function buildGeneratedMcpCommandTools() {
  const catalog = buildAgentCommandCatalog();
  const tools: Record<string, GeneratedMcpCommandTool> = {};

  for (const command of catalog.commands) {
    if (!canExposeCommandAsGeneratedMcpTool(command.rootCommand)) continue;

    const reservedNames = new Set<string>(['cwd', 'timeoutMs']);
    const positionalBindings = command.args.map((arg) => ({
      inputName: toPositionalInputName(arg.name, reservedNames),
      rawName: arg.raw,
      required: arg.required,
      variadic: arg.variadic
    }));
    const optionBindings = command.options.map((option) => ({
      inputName: toOptionInputName(option.primaryFlag, reservedNames),
      flag: option.primaryFlag,
      rawName: option.rawName,
      description: option.description,
      takesValue: option.takesValue,
      valueRequired: option.valueRequired,
      boolean: option.boolean
    }));

    const properties: Record<string, JsonSchemaProperty> = {};
    const required: string[] = [];

    for (const binding of positionalBindings) {
      properties[binding.inputName] = binding.variadic
        ? { type: 'array', items: { type: 'string' }, description: toPositionalDescription(binding.rawName, binding.required, binding.variadic) }
        : { type: 'string', description: toPositionalDescription(binding.rawName, binding.required, binding.variadic) };
      if (binding.required) required.push(binding.inputName);
    }

    for (const binding of optionBindings) {
      properties[binding.inputName] = binding.boolean
        ? { type: 'boolean', description: binding.description || `CLI option: ${binding.rawName}` }
        : { type: 'string', description: binding.description || `CLI option: ${binding.rawName}` };
    }

    properties.cwd = { type: 'string', description: 'Working directory relative to projectRoot (default: projectRoot).' };
    properties.timeoutMs = { type: 'number', description: 'Command timeout in milliseconds.' };

    const descriptionSuffix = 'Auto-generated from the shared licell CLI registry.';
    const safetyHint = command.safety
      ? ` Safety: ${command.safety.level} — ${command.safety.reason}`
      : '';
    const description = command.description
      ? `${command.description}${safetyHint} ${descriptionSuffix}`
      : `${safetyHint.trim()} ${descriptionSuffix}`.trim();

    const tool: GeneratedMcpCommandTool = {
      name: toGeneratedMcpToolName(command.key),
      title: `Run ${command.invocation}`,
      description,
      inputSchema: {
        type: 'object',
        additionalProperties: false,
        properties,
        ...(required.length > 0 ? { required: unique(required) } : {})
      },
      commandKey: command.key,
      ...(inferDestructive(command) ? { annotations: { destructiveHint: true } } : {}),
      positionalBindings,
      optionBindings
    };

    tools[tool.name] = tool;
  }

  return tools;
}

function ensureStringArray(value: unknown, inputName: string) {
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string' || item.trim() === '')) {
    throw new Error(`${inputName} must be a non-empty string[]`);
  }
  return value.map((item) => item.trim());
}

function ensureScalarString(value: unknown, inputName: string) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`${inputName} must be a non-empty string`);
  }
  return value.trim();
}

export function buildArgvForGeneratedMcpCommandTool(tool: GeneratedMcpCommandTool, input: Record<string, unknown>) {
  const argv = tool.commandKey.split(' ');

  for (const binding of tool.positionalBindings) {
    const value = input[binding.inputName];
    if (value === undefined || value === null || value === '') {
      if (binding.required) throw new Error(`${binding.inputName} is required`);
      continue;
    }

    if (binding.variadic) {
      argv.push(...ensureStringArray(value, binding.inputName));
      continue;
    }

    argv.push(ensureScalarString(value, binding.inputName));
  }

  for (const binding of tool.optionBindings) {
    const value = input[binding.inputName];
    if (binding.boolean) {
      if (value === true) argv.push(binding.flag);
      continue;
    }

    if (value === undefined || value === null || value === '') {
      continue;
    }

    argv.push(binding.flag, ensureScalarString(value, binding.inputName));
  }

  return argv;
}
