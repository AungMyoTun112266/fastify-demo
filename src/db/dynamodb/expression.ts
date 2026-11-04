export class ExpressionAttributes {
  readonly #names = new Map<string, string>();
  readonly #values: Record<string, unknown> = {};
  #valueCount = 0;

  name(attribute: string): string {
    let alias = this.#names.get(attribute);
    if (alias === undefined) {
      alias = `#n${this.#names.size}`;
      this.#names.set(attribute, alias);
    }
    return alias;
  }

  value(value: unknown): string {
    const alias = `:v${this.#valueCount++}`;
    this.#values[alias] = value;
    return alias;
  }

  toInput(): {
    ExpressionAttributeNames?: Record<string, string>;
    ExpressionAttributeValues?: Record<string, unknown>;
  } {
    const names = Object.fromEntries(
      [...this.#names].map(([attribute, alias]) => [alias, attribute]),
    );
    return {
      ...(this.#names.size > 0 ? { ExpressionAttributeNames: names } : {}),
      ...(this.#valueCount > 0 ? { ExpressionAttributeValues: this.#values } : {}),
    };
  }
}
