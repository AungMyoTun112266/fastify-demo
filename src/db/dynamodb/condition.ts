import type { ExpressionAttributes } from "./expression.js";

type Value<V> = Exclude<V, undefined>;
type ContainsValue<V> = V extends readonly (infer E)[] ? E : string;

type AttributeCondition<T> = {
  [K in keyof T & string]:
    | { attribute: K; equals: Value<T[K]> }
    | { attribute: K; notEquals: Value<T[K]> }
    | { attribute: K; lessThan: Value<T[K]> }
    | { attribute: K; lessThanOrEqual: Value<T[K]> }
    | { attribute: K; greaterThan: Value<T[K]> }
    | { attribute: K; greaterThanOrEqual: Value<T[K]> }
    | { attribute: K; between: readonly [Value<T[K]>, Value<T[K]>] }
    | { attribute: K; beginsWith: string }
    | { attribute: K; contains: ContainsValue<Value<T[K]>> }
    | { attribute: K; exists: true }
    | { attribute: K; notExists: true };
}[keyof T & string];

export type Condition<T> =
  | AttributeCondition<T>
  | { and: readonly Condition<T>[] }
  | { or: readonly Condition<T>[] }
  | { not: Condition<T> };

export type SortKeyCondition<T> = Exclude<
  AttributeCondition<T>,
  { notEquals: unknown } | { contains: unknown } | { exists: true } | { notExists: true }
>;

export function buildCondition<T>(
  condition: Condition<T>,
  attrs: ExpressionAttributes,
): string {
  if ("and" in condition) return join(condition.and, " AND ", attrs);
  if ("or" in condition) return join(condition.or, " OR ", attrs);
  if ("not" in condition) return `NOT (${buildCondition(condition.not, attrs)})`;

  const name = attrs.name(condition.attribute);

  if ("equals" in condition) return `${name} = ${attrs.value(condition.equals)}`;
  if ("notEquals" in condition) return `${name} <> ${attrs.value(condition.notEquals)}`;
  if ("lessThan" in condition) return `${name} < ${attrs.value(condition.lessThan)}`;
  if ("lessThanOrEqual" in condition) return `${name} <= ${attrs.value(condition.lessThanOrEqual)}`;
  if ("greaterThan" in condition) return `${name} > ${attrs.value(condition.greaterThan)}`;
  if ("greaterThanOrEqual" in condition) return `${name} >= ${attrs.value(condition.greaterThanOrEqual)}`;
  if ("between" in condition) {
    const [from, to] = condition.between;
    return `${name} BETWEEN ${attrs.value(from)} AND ${attrs.value(to)}`;
  }
  if ("beginsWith" in condition) return `begins_with(${name}, ${attrs.value(condition.beginsWith)})`;
  if ("contains" in condition) return `contains(${name}, ${attrs.value(condition.contains)})`;
  if ("exists" in condition) return `attribute_exists(${name})`;
  return `attribute_not_exists(${name})`;
}

function join<T>(
  conditions: readonly Condition<T>[],
  operator: string,
  attrs: ExpressionAttributes,
): string {
  if (conditions.length === 0) {
    throw new Error("`and` / `or` needs at least one condition");
  }
  return `(${conditions.map((c) => buildCondition(c, attrs)).join(operator)})`;
}
