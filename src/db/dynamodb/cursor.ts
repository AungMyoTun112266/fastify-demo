import { appErrors } from "../../shared/errors/index.js";
import { coerce, type DynamoDBKey } from "./types.js";

export function encodeCursor(key: DynamoDBKey): string {
  return Buffer.from(JSON.stringify(key)).toString("base64");
}

export function decodeCursor(cursor: string): DynamoDBKey {
  try {
    return coerce<DynamoDBKey>(
      JSON.parse(Buffer.from(cursor, "base64").toString("utf8")),
    );
  } catch {
    throw appErrors.validationFailed();
  }
}
