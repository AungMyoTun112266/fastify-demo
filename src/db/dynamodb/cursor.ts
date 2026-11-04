import { appErrors } from "../../shared/errors/index.js";

type Key = Record<string, unknown>;

function isKey(value: unknown): value is Key {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function encodeCursor(key: Key): string {
  return Buffer.from(JSON.stringify(key)).toString("base64url");
}

export function decodeCursor(cursor: string): Key {
  let key: unknown;
  try {
    key = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8"));
  } catch {
    throw appErrors.invalidCursor();
  }
  if (!isKey(key)) {
    throw appErrors.invalidCursor();
  }
  return key;
}
