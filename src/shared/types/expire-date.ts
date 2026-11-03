import { Brand } from "../../shared/types/brand.js";
import {
  currentDate,
  isBeforeDate,
  isExpiredDate,
  isValidDate,
  parseDate,
  yesterdayDate,
} from "../time/time.js";

export type ExpireDate = Brand<string, "ExpireDate">;

export const ExpireDate = Object.freeze({
  create(value: string | Date): ExpireDate {
    const parsed = parseDate(value);
    if (!this.is(parsed)) {
      throw new Error(`Invalid ExpireDate: ${parsed}`);
    }

    return Brand.create<string, "ExpireDate">(parsed);
  },

  now(): ExpireDate {
    return this.create(currentDate());
  },

  yesterday(): ExpireDate {
    return this.create(yesterdayDate());
  },

  is(value: unknown): value is ExpireDate {
    return typeof value === "string" && isValidDate(value);
  },

  isExpired(value: ExpireDate): boolean {
    return isExpiredDate(value);
  },

  isBefore(value: ExpireDate, other: ExpireDate): boolean {
    return isBeforeDate(value, other);
  },

  latest(value: ExpireDate | null, other: ExpireDate): ExpireDate {
    if (value === null) {
      return other;
    }

    return this.isBefore(value, other) ? other : value;
  },
});
