import { TZDate } from "@date-fns/tz";
import { format, isValid, parseISO, subDays } from "date-fns";

const TIME_ZONE = "Asia/Tokyo";

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const toTokyoDate = (value: string | Date): TZDate => {
  if (value instanceof Date) {
    if (!isValid(value)) {
      throw new Error(`Invalid date: ${value.toString()}`);
    }

    return new TZDate(value.getTime(), TIME_ZONE);
  }

  const parsed = parseISO(value);

  if (!isValid(parsed)) {
    throw new Error(`Invalid date: ${value}`);
  }

  if (DATE_ONLY_PATTERN.test(value)) {
    return TZDate.tz(
      TIME_ZONE,
      parsed.getFullYear(),
      parsed.getMonth(),
      parsed.getDate(),
    );
  }

  return new TZDate(parsed.getTime(), TIME_ZONE);
};

export const currentDateTime = (): string => {
  return format(TZDate.tz(TIME_ZONE), "yyyy-MM-dd HH:mm:ss");
};

export const currentMs = (): number => {
  return Date.now();
};

export const currentDate = (): string => {
  return format(TZDate.tz(TIME_ZONE), "yyyy-MM-dd");
};

export const yesterdayDate = (): string => {
  return format(subDays(TZDate.tz(TIME_ZONE), 1), "yyyy-MM-dd");
};

export const currentYearMonth = (): string => {
  return format(TZDate.tz(TIME_ZONE), "yyyyMM");
};

export const parseDate = (date: string | Date): string => {
  return format(toTokyoDate(date), "yyyy-MM-dd");
};

export const isValidDate = (value: string): boolean => {
  if (!DATE_ONLY_PATTERN.test(value)) {
    return false;
  }
  const parsed = parseISO(value);
  return isValid(parsed) && format(parsed, "yyyy-MM-dd") === value;
};

export const isExpiredDate = (expire_date: string): boolean => {
  return expire_date < currentDate();
};

export const isBeforeDate = (dateOne: string, dateTwo: string): boolean => {
  return dateOne < dateTwo;
};
