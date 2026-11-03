declare const __brand: unique symbol;

export type Brand<T, B extends string> = T & {
  readonly [__brand]: B;
};

export const Brand = Object.freeze({
  create<T, B extends string>(value: T): Brand<T, B> {
    return value as Brand<T, B>;
  },
});
