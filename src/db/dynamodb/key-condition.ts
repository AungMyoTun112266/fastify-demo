import {
  createAliasRegistry,
  type CompiledExpression,
} from "./expression.js";

export interface KeyCondition<T> {
  hash: HashKeyPredicate<T> | ReadonlyArray<HashKeyPredicate<T>>;
  range?: RangeKeyPredicate<T>;
}

export type HashKeyPredicate<T> = {
  [K in keyof T & string]: { attribute: K; value: T[K] };
}[keyof T & string];

export type RangeKeyPredicate<T> = {
  [K in keyof T & string]:
    | { attribute: K; equals: T[K] }
    | { attribute: K; lessThan: T[K] }
    | { attribute: K; lessThanOrEqual: T[K] }
    | { attribute: K; greaterThan: T[K] }
    | { attribute: K; greaterThanOrEqual: T[K] }
    | { attribute: K; between: [T[K], T[K]] }
    | { attribute: K; beginsWith: string };
}[keyof T & string];

export function compileKeyCondition<T>(
  key: KeyCondition<T>,
): CompiledExpression {
  const registry = createAliasRegistry();
  let counter = 0;
  const nameAlias = (attribute: string): string =>
    registry.nameAlias(attribute);
  const valueAlias = (attribute: string, value: unknown): string =>
    registry.valueAlias(attribute, `key${counter++}`, value);

  const hashPredicates: ReadonlyArray<HashKeyPredicate<T>> = Array.isArray(
    key.hash,
  )
    ? key.hash
    : [key.hash];
  const clauses = hashPredicates.map(
    (predicate) =>
      `${nameAlias(predicate.attribute)} = ${valueAlias(
        predicate.attribute,
        predicate.value,
      )}`,
  );
  if (key.range) {
    clauses.push(compileRange(key.range, nameAlias, valueAlias));
  }

  return {
    expression: clauses.join(" AND "),
    expressionAttributeNames: registry.names,
    expressionAttributeValues: registry.values,
  };
}

function compileRange<T>(
  predicate: RangeKeyPredicate<T>,
  nameAlias: (attribute: string) => string,
  valueAlias: (attribute: string, value: unknown) => string,
): string {
  const name = nameAlias(predicate.attribute);

  if ("equals" in predicate)
    return `${name} = ${valueAlias(predicate.attribute, predicate.equals)}`;
  if ("lessThan" in predicate)
    return `${name} < ${valueAlias(predicate.attribute, predicate.lessThan)}`;
  if ("lessThanOrEqual" in predicate)
    return `${name} <= ${valueAlias(
      predicate.attribute,
      predicate.lessThanOrEqual,
    )}`;
  if ("greaterThan" in predicate)
    return `${name} > ${valueAlias(predicate.attribute, predicate.greaterThan)}`;
  if ("greaterThanOrEqual" in predicate)
    return `${name} >= ${valueAlias(
      predicate.attribute,
      predicate.greaterThanOrEqual,
    )}`;
  if ("between" in predicate) {
    const [from, to] = predicate.between;
    return `${name} BETWEEN ${valueAlias(predicate.attribute, from)} AND ${valueAlias(predicate.attribute, to)}`;
  }
  return `begins_with(${name}, ${valueAlias(predicate.attribute, predicate.beginsWith)})`;
}
