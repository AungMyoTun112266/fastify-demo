import {
  createAliasRegistry,
  type AliasRegistry,
  type CompiledExpression,
} from "./expression.js";

export type Filter<T> =
  | {
      [K in keyof T & string]:
        | { attribute: K; equals: T[K] }
        | { attribute: K; notEquals: T[K] }
        | { attribute: K; lessThan: T[K] }
        | { attribute: K; lessThanOrEqual: T[K] }
        | { attribute: K; greaterThan: T[K] }
        | { attribute: K; greaterThanOrEqual: T[K] }
        | { attribute: K; between: [T[K], T[K]] }
        | { attribute: K; beginsWith: string }
        | { attribute: K; contains: string }
        | { attribute: K; exists: true }
        | { attribute: K; notExists: true };
    }[keyof T & string]
  | { or: ReadonlyArray<Filter<T>> }
  | { and: ReadonlyArray<Filter<T>> };

export function whenDefined<T, V>(
  value: V | undefined,
  build: (value: V) => Filter<T>,
): Filter<T> | undefined {
  return value === undefined ? undefined : build(value);
}

export function definedFilters<T>(
  ...filters: ReadonlyArray<Filter<T> | undefined>
): Filter<T>[] {
  return filters.filter((filter): filter is Filter<T> => filter !== undefined);
}

export function compileFilter<T>(filter: Filter<T>): CompiledExpression {
  const registry = createAliasRegistry();
  let counter = 0;
  const valueAlias = (attribute: string, value: unknown): string =>
    registry.valueAlias(attribute, `f${counter++}`, value);

  const expression = renderFilter(filter, registry, valueAlias);

  return {
    expression,
    expressionAttributeNames: registry.names,
    expressionAttributeValues: registry.values,
  };
}

function renderFilter<T>(
  filter: Filter<T>,
  registry: AliasRegistry,
  valueAlias: (attribute: string, value: unknown) => string,
): string {
  if ("or" in filter) {
    return `(${filter.or.map((f) => renderFilter(f, registry, valueAlias)).join(" OR ")})`;
  }
  if ("and" in filter) {
    return `(${filter.and.map((f) => renderFilter(f, registry, valueAlias)).join(" AND ")})`;
  }

  const name = registry.nameAlias(filter.attribute);

  if ("equals" in filter)
    return `${name} = ${valueAlias(filter.attribute, filter.equals)}`;
  if ("notEquals" in filter)
    return `${name} <> ${valueAlias(filter.attribute, filter.notEquals)}`;
  if ("lessThan" in filter)
    return `${name} < ${valueAlias(filter.attribute, filter.lessThan)}`;
  if ("lessThanOrEqual" in filter)
    return `${name} <= ${valueAlias(filter.attribute, filter.lessThanOrEqual)}`;
  if ("greaterThan" in filter)
    return `${name} > ${valueAlias(filter.attribute, filter.greaterThan)}`;
  if ("greaterThanOrEqual" in filter)
    return `${name} >= ${valueAlias(filter.attribute, filter.greaterThanOrEqual)}`;
  if ("between" in filter) {
    const [from, to] = filter.between;
    return `${name} BETWEEN ${valueAlias(filter.attribute, from)} AND ${valueAlias(filter.attribute, to)}`;
  }
  if ("beginsWith" in filter)
    return `begins_with(${name}, ${valueAlias(filter.attribute, filter.beginsWith)})`;
  if ("contains" in filter)
    return `contains(${name}, ${valueAlias(filter.attribute, filter.contains)})`;
  if ("exists" in filter) return `attribute_exists(${name})`;
  return `attribute_not_exists(${name})`;
}
