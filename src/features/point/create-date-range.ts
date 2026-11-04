import type { SortKeyCondition } from "../../db/dynamodb/index.js";
import { Brand } from "../../shared/types/brand.js";
import type { DateTime } from "./point.types.js";

type DateRangeBoundary = "exact" | "calendar-day";

export function buildCreateDateRange(
  fromDate: DateTime | undefined,
  toDate: DateTime | undefined,
  boundary: DateRangeBoundary = "exact",
): SortKeyCondition<{ create_date: DateTime }> | undefined {
  const from = fromDate && (boundary === "calendar-day" ? startOfDay(fromDate) : fromDate);
  const to = toDate && (boundary === "calendar-day" ? endOfDay(toDate) : toDate);

  if (from && to) return { attribute: "create_date", between: [from, to] };
  if (from) return { attribute: "create_date", greaterThanOrEqual: from };
  if (to) return { attribute: "create_date", lessThanOrEqual: to };
  return undefined;
}

function startOfDay(value: DateTime): DateTime {
  return Brand.create<string, "DateTime">(`${value.slice(0, 10)} 00:00:00`);
}

function endOfDay(value: DateTime): DateTime {
  return Brand.create<string, "DateTime">(`${value.slice(0, 10)} 23:59:59`);
}
