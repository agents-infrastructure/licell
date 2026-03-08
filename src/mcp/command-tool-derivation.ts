import type { AgentCommandCatalogEntry } from '../utils/command-reference';
import { toOptionalBoolean, toOptionalNumber, toOptionalString } from './tool-arg-utils';

export interface CommandToolSchemaProperty extends Record<string, unknown> {
  type?: 'string' | 'boolean' | 'array' | 'number' | 'object';
  items?: { type: 'string' };
  description?: string;
  enum?: string[];
  additionalProperties?: boolean;
}

export interface DerivedCommandInputOverride {
  inputName?: string;
  schema?: CommandToolSchemaProperty;
  bindAs?: 'string' | 'number' | 'boolean' | 'json' | 'stringArray';
  required?: boolean;
}

export interface DerivedPositionalBinding {
  inputName: string;
  rawName: string;
  required: boolean;
  variadic: boolean;
  bindAs: 'string' | 'number' | 'json' | 'stringArray';
}

export interface DerivedOptionBinding {
  inputName: string;
  flag: string;
  rawName: string;
  description: string;
  takesValue: boolean;
  valueRequired: boolean;
  boolean: boolean;
  required: boolean;
  bindAs: 'string' | 'number' | 'boolean' | 'json';
}

export interface DerivedCommandToolShape {
  properties: Record<string, CommandToolSchemaProperty>;
  required: string[];
  positionalBindings: DerivedPositionalBinding[];
  optionBindings: DerivedOptionBinding[];
}

export interface DeriveCommandToolShapeOptions {
  inputOverrides?: Record<string, DerivedCommandInputOverride | CommandToolSchemaProperty>;
  omitInputs?: string[];
  requiredInputs?: string[];
  includeExecutionProps?: boolean;
  timeoutDescription?: string;
  reservedNames?: string[];
  useArgumentHints?: boolean;
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

function normalizeOverride(
  override?: DerivedCommandInputOverride | CommandToolSchemaProperty
): DerivedCommandInputOverride | undefined {
  if (!override) return undefined;
  if ('schema' in override || 'bindAs' in override || 'inputName' in override || 'required' in override) {
    return override as DerivedCommandInputOverride;
  }
  return { schema: override as CommandToolSchemaProperty } satisfies DerivedCommandInputOverride;
}

function resolvePositionalOverride(
  arg: AgentCommandCatalogEntry['args'][number],
  inputOverrides: Record<string, DerivedCommandInputOverride | CommandToolSchemaProperty> | undefined,
  defaultInputName: string
) {
  return normalizeOverride(
    inputOverrides?.[defaultInputName]
    || inputOverrides?.[arg.name]
    || inputOverrides?.[arg.raw]
  );
}

function resolveOptionOverride(
  option: AgentCommandCatalogEntry['options'][number],
  inputOverrides: Record<string, DerivedCommandInputOverride | CommandToolSchemaProperty> | undefined,
  defaultInputName: string
) {
  return normalizeOverride(
    inputOverrides?.[defaultInputName]
    || inputOverrides?.[option.primaryFlag]
    || inputOverrides?.[option.rawName]
  );
}

function inferBindingFromSchema(
  schema: CommandToolSchemaProperty,
  fallback: 'string' | 'boolean' | 'stringArray'
): 'string' | 'number' | 'boolean' | 'json' | 'stringArray' {
  if (schema.type === 'number') return 'number';
  if (schema.type === 'object') return 'json';
  if (schema.type === 'array') return 'stringArray';
  if (schema.type === 'boolean') return 'boolean';
  return fallback;
}

function inferOptionBindingFromSchema(
  schema: CommandToolSchemaProperty,
  fallback: 'string' | 'boolean'
): 'string' | 'number' | 'boolean' | 'json' {
  const binding = inferBindingFromSchema(schema, fallback);
  return binding === 'stringArray' ? 'string' : binding;
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

function ensureFiniteNumber(value: unknown, inputName: string) {
  const number = toOptionalNumber(value);
  if (number === undefined) throw new Error(`${inputName} must be a finite number`);
  return number;
}

function schemasEqual(left: CommandToolSchemaProperty | undefined, right: CommandToolSchemaProperty | undefined) {
  return JSON.stringify(left || null) === JSON.stringify(right || null);
}

function positionalBindingsEqual(left: DerivedPositionalBinding, right: DerivedPositionalBinding) {
  return left.inputName === right.inputName
    && left.rawName === right.rawName
    && left.required === right.required
    && left.variadic === right.variadic
    && left.bindAs === right.bindAs;
}

function optionBindingsEqual(left: DerivedOptionBinding, right: DerivedOptionBinding) {
  return left.inputName === right.inputName
    && left.flag === right.flag
    && left.rawName === right.rawName
    && left.description === right.description
    && left.takesValue === right.takesValue
    && left.valueRequired === right.valueRequired
    && left.boolean === right.boolean
    && left.required === right.required
    && left.bindAs === right.bindAs;
}

export function deriveCommandToolShape(
  command: Pick<AgentCommandCatalogEntry, 'args' | 'options' | 'argumentHints'>,
  options?: DeriveCommandToolShapeOptions
): DerivedCommandToolShape {
  const reserved = new Set(options?.reservedNames || []);
  if (options?.includeExecutionProps !== false) {
    reserved.add('cwd');
    reserved.add('timeoutMs');
  }
  const omitted = new Set(options?.omitInputs || []);
  const extraRequired = new Set(options?.requiredInputs || []);

  const properties: Record<string, CommandToolSchemaProperty> = {};
  const required: string[] = [];
  const positionalBindings: DerivedPositionalBinding[] = [];
  const optionBindings: DerivedOptionBinding[] = [];

  for (const arg of command.args) {
    const defaultInputName = toPositionalInputName(arg.name, reserved);
    const override = resolvePositionalOverride(arg, options?.inputOverrides, defaultInputName);
    const inputName = override?.inputName || defaultInputName;
    if (omitted.has(inputName)) continue;

    const schema: CommandToolSchemaProperty = {
      ...(arg.variadic
        ? { type: 'array', items: { type: 'string' as const } }
        : { type: 'string' as const }),
      description: options?.useArgumentHints !== false
        ? (command.argumentHints[arg.name] || toPositionalDescription(arg.raw, arg.required, arg.variadic))
        : toPositionalDescription(arg.raw, arg.required, arg.variadic),
      ...(override?.schema || {})
    };
    const binding = override?.bindAs || inferBindingFromSchema(schema, arg.variadic ? 'stringArray' : 'string');
    const isRequired = override?.required ?? arg.required ?? extraRequired.has(inputName);

    properties[inputName] = schema;
    positionalBindings.push({
      inputName,
      rawName: arg.raw,
      required: isRequired,
      variadic: arg.variadic,
      bindAs: binding === 'boolean' ? 'string' : binding
    });
    if (isRequired) required.push(inputName);
  }

  for (const option of command.options) {
    const defaultInputName = toOptionInputName(option.primaryFlag, reserved);
    const override = resolveOptionOverride(option, options?.inputOverrides, defaultInputName);
    const inputName = override?.inputName || defaultInputName;
    if (omitted.has(inputName)) continue;

    const schema: CommandToolSchemaProperty = {
      ...(option.boolean ? { type: 'boolean' as const } : { type: 'string' as const }),
      description: option.description || `CLI option: ${option.rawName}`,
      ...(override?.schema || {})
    };
    const binding = override?.bindAs === 'stringArray'
      ? 'string'
      : (override?.bindAs || inferOptionBindingFromSchema(schema, option.boolean ? 'boolean' : 'string'));
    const isRequired = override?.required ?? extraRequired.has(inputName);

    properties[inputName] = schema;
    optionBindings.push({
      inputName,
      flag: option.primaryFlag,
      rawName: option.rawName,
      description: option.description,
      takesValue: option.takesValue,
      valueRequired: option.valueRequired,
      boolean: option.boolean,
      required: isRequired,
      bindAs: binding
    });
    if (isRequired) required.push(inputName);
  }

  if (options?.includeExecutionProps !== false) {
    properties.cwd = { type: 'string', description: 'Working directory relative to projectRoot (default: projectRoot).' };
    properties.timeoutMs = { type: 'number', description: options?.timeoutDescription || 'Command timeout in milliseconds.' };
  }

  return {
    properties,
    required: unique(required),
    positionalBindings,
    optionBindings
  };
}

export function deriveSharedCommandToolShape(
  commands: Array<Pick<AgentCommandCatalogEntry, 'args' | 'options' | 'argumentHints'>>,
  options?: DeriveCommandToolShapeOptions
): DerivedCommandToolShape {
  if (commands.length === 0) {
    throw new Error('deriveSharedCommandToolShape requires at least one command');
  }

  const shapes = commands.map((command) => deriveCommandToolShape(command, options));
  if (shapes.length === 1) return shapes[0];

  const [base, ...rest] = shapes;
  const properties = Object.fromEntries(
    Object.entries(base.properties).filter(([inputName, schema]) => {
      return rest.every((shape) => schemasEqual(shape.properties[inputName], schema));
    })
  );

  const required = base.required.filter((inputName) => {
    if (!(inputName in properties)) return false;
    return rest.every((shape) => shape.required.includes(inputName));
  });

  const positionalBindings = base.positionalBindings.filter((binding) => {
    if (!(binding.inputName in properties)) return false;
    return rest.every((shape) => shape.positionalBindings.some((other) => positionalBindingsEqual(other, binding)));
  });

  const optionBindings = base.optionBindings.filter((binding) => {
    if (!(binding.inputName in properties)) return false;
    return rest.every((shape) => shape.optionBindings.some((other) => optionBindingsEqual(other, binding)));
  });

  return {
    properties,
    required: unique(required),
    positionalBindings,
    optionBindings
  };
}

export function appendDerivedBindingsToArgv(
  shape: Pick<DerivedCommandToolShape, 'positionalBindings' | 'optionBindings'>,
  input: Record<string, unknown>,
  argv: string[]
) {
  for (const binding of shape.positionalBindings) {
    const value = input[binding.inputName];
    if (value === undefined || value === null || value === '') {
      if (binding.required) throw new Error(`${binding.inputName} is required`);
      continue;
    }

    if (binding.bindAs === 'stringArray') {
      argv.push(...ensureStringArray(value, binding.inputName));
      continue;
    }

    if (binding.bindAs === 'number') {
      argv.push(String(ensureFiniteNumber(value, binding.inputName)));
      continue;
    }

    if (binding.bindAs === 'json') {
      argv.push(JSON.stringify(value));
      continue;
    }

    argv.push(ensureScalarString(value, binding.inputName));
  }

  for (const binding of shape.optionBindings) {
    const value = input[binding.inputName];
    if (binding.bindAs === 'boolean') {
      if (value === undefined || value === null) {
        if (binding.required) throw new Error(`${binding.inputName} is required`);
        continue;
      }
      if (toOptionalBoolean(value) !== true) {
        if (binding.required) throw new Error(`${binding.inputName} must be true`);
        continue;
      }
      argv.push(binding.flag);
      continue;
    }

    if (value === undefined || value === null || value === '') {
      if (binding.required) throw new Error(`${binding.inputName} is required`);
      continue;
    }

    if (binding.bindAs === 'number') {
      argv.push(binding.flag, String(ensureFiniteNumber(value, binding.inputName)));
      continue;
    }

    if (binding.bindAs === 'json') {
      argv.push(binding.flag, JSON.stringify(value));
      continue;
    }

    argv.push(binding.flag, ensureScalarString(value, binding.inputName));
  }
}
