import { v7, validate, version } from "uuid";

import { Brand } from "../../shared/types/brand.js";

export type InvoiceId = Brand<string, "InvoiceId">;

export const InvoiceId = Object.freeze({
  new(): InvoiceId {
    return this.create(v7());
  },

  create(value: string): InvoiceId {
    if (!this.is(value)) {
      throw new Error(`Invalid InvoiceId: ${value}`);
    }

    return Brand.create<string, "InvoiceId">(value);
  },

  is(value: unknown): value is InvoiceId {
    return typeof value === "string" && validate(value) && version(value) === 7;
  },
});
