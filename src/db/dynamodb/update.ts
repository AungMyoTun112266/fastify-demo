import type { ExpressionAttributes } from "./expression.js";

type NumberKeys<T> = {
  [K in keyof T]-?: Exclude<T[K], undefined> extends number ? K : never;
}[keyof T] &
  string;

type OptionalKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? K : never;
}[keyof T] &
  string;

export interface Update<T> {
  set?: Partial<T>;
  add?: { [K in NumberKeys<T>]?: number };
  remove?: readonly OptionalKeys<T>[];
}

export function buildUpdate<T>(
  update: Update<T>,
  attrs: ExpressionAttributes,
): string {
  const set = Object.entries(update.set ?? {})
    .filter(([, value]) => value !== undefined)
    .map(([attribute, value]) => `${attrs.name(attribute)} = ${attrs.value(value)}`);

  const add = Object.entries(update.add ?? {})
    .filter(([, amount]) => amount !== undefined)
    .map(([attribute, amount]) => `${attrs.name(attribute)} ${attrs.value(amount)}`);

  const remove = (update.remove ?? []).map((attribute) => attrs.name(attribute));

  const expression = [
    set.length > 0 ? `SET ${set.join(", ")}` : "",
    add.length > 0 ? `ADD ${add.join(", ")}` : "",
    remove.length > 0 ? `REMOVE ${remove.join(", ")}` : "",
  ]
    .filter(Boolean)
    .join(" ");

  if (expression === "") {
    throw new Error("An update needs at least one of set / add / remove");
  }
  return expression;
}
