import type { DynamoDBItem } from "./types.js";

export interface CompiledExpression {
  expression: string;
  expressionAttributeNames: Record<string, string>;
  expressionAttributeValues: DynamoDBItem;
}

export interface AliasRegistry {
  readonly names: Record<string, string>;
  readonly values: DynamoDBItem;
  nameAlias(attribute: string): string;
  valueAlias(attribute: string, suffix: string, value: unknown): string;
}

export function createAliasRegistry(): AliasRegistry {
  const names: Record<string, string> = {};
  const values: DynamoDBItem = {};

  return {
    names,
    values,
    nameAlias(attribute) {
      const alias = `#${attribute}`;
      names[alias] = attribute;
      return alias;
    },
    valueAlias(attribute, suffix, value) {
      const alias = `:${attribute}_${suffix}`;
      values[alias] = value;
      return alias;
    },
  };
}
