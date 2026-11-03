import { createAliasRegistry, type AliasRegistry } from "./expression.js";

interface UpdateClauses<T> {
  set?: Partial<T>;
  add?: NumericPartial<T>;
  subtract?: NumericPartial<T>;
  remove?: ReadonlyArray<keyof T & string>;
}

type RequireAtLeastOne<T> = {
  [K in keyof T]-?: Required<Pick<T, K>> & Partial<Omit<T, K>>;
}[keyof T];

export type UpdateOperations<T> = RequireAtLeastOne<UpdateClauses<T>>;

export type NumericPartial<T> = {
  [K in keyof T as T[K] extends number | undefined ? K : never]?: number;
};

export interface UpdateCondition<T> {
  exists?: ReadonlyArray<keyof T & string>;
  notExists?: ReadonlyArray<keyof T & string>;
  equals?: Partial<T>;
  greaterThanOrEqual?: NumericPartial<T>;
}

export interface CompiledUpdate {
  updateExpression: string;
  expressionAttributeNames: Record<string, string>;
  expressionAttributeValues: Record<string, unknown>;
  conditionExpression?: string;
}

function buildSetClauses<T>(
  ops: UpdateOperations<T>,
  aliases: AliasRegistry,
): string[] {
  const clauses: string[] = [];

  for (const [attribute, value] of Object.entries(ops.set ?? {})) {
    if (value === undefined) continue;
    clauses.push(
      `${aliases.nameAlias(attribute)} = ${aliases.valueAlias(attribute, "set", value)}`,
    );
  }

  for (const [attribute, amount] of Object.entries(ops.subtract ?? {})) {
    if (amount === null) continue;
    const name = aliases.nameAlias(attribute);
    clauses.push(
      `${name} = ${name} - ${aliases.valueAlias(attribute, "sub", amount)}`,
    );
  }

  return clauses;
}

function buildAddClauses<T>(
  ops: UpdateOperations<T>,
  aliases: AliasRegistry,
): string[] {
  const clauses: string[] = [];

  for (const [attribute, amount] of Object.entries(ops.add ?? {})) {
    if (amount === null) continue;
    clauses.push(
      `${aliases.nameAlias(attribute)} ${aliases.valueAlias(attribute, "add", amount)}`,
    );
  }

  return clauses;
}

function buildRemoveClauses<T>(
  ops: UpdateOperations<T>,
  aliases: AliasRegistry,
): string[] {
  return (ops.remove ?? []).map((attribute) => aliases.nameAlias(attribute));
}

function formatSegment(keyword: string, clauses: string[]): string | undefined {
  return clauses.length > 0 ? `${keyword} ${clauses.join(", ")}` : undefined;
}

export function compileUpdate<T>(
  ops: UpdateOperations<T>,
  condition: UpdateCondition<T> = {},
): CompiledUpdate {
  const aliases = createAliasRegistry();

  const segments = [
    formatSegment("SET", buildSetClauses(ops, aliases)),
    formatSegment("ADD", buildAddClauses(ops, aliases)),
    formatSegment("REMOVE", buildRemoveClauses(ops, aliases)),
  ].filter((segment): segment is string => segment !== undefined);

  if (segments.length === 0) {
    throw new Error(
      "An update needs at least one of set / add / subtract / remove",
    );
  }

  const conditionExpression = compileCondition(condition, aliases);

  return {
    updateExpression: segments.join(" "),
    expressionAttributeNames: aliases.names,
    expressionAttributeValues: aliases.values,
    ...(conditionExpression !== undefined ? { conditionExpression } : {}),
  };
}

export function compileCondition<T>(
  condition: UpdateCondition<T>,
  aliases: AliasRegistry,
): string | undefined {
  const clauses: string[] = [];

  for (const attribute of condition.exists ?? []) {
    clauses.push(`attribute_exists(${aliases.nameAlias(attribute)})`);
  }
  for (const attribute of condition.notExists ?? []) {
    clauses.push(`attribute_not_exists(${aliases.nameAlias(attribute)})`);
  }
  for (const [attribute, value] of Object.entries(condition.equals ?? {})) {
    if (value === undefined) continue;
    clauses.push(
      `${aliases.nameAlias(attribute)} = ${aliases.valueAlias(attribute, "cond", value)}`,
    );
  }
  for (const [attribute, value] of Object.entries(
    condition.greaterThanOrEqual ?? {},
  )) {
    if (value === null) continue;
    clauses.push(
      `${aliases.nameAlias(attribute)} >= ${aliases.valueAlias(attribute, "cond", value)}`,
    );
  }

  return clauses.length > 0 ? clauses.join(" AND ") : undefined;
}
