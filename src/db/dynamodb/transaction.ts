import {
  ConditionalCheckFailedException,
  TransactionCanceledException,
} from "@aws-sdk/client-dynamodb";
import {
  TransactWriteCommand,
  type TransactWriteCommandInput,
} from "@aws-sdk/lib-dynamodb";

import { appErrors } from "../../shared/errors/index.js";
import { dynamodb } from "./client.js";

export type TransactionItem = NonNullable<
  TransactWriteCommandInput["TransactItems"]
>[number];

const MAX_ITEMS = 100;
const MAX_ATTEMPTS = 5;
const RETRY_BASE_MS = 25;

export async function transactWrite(items: TransactionItem[]): Promise<void> {
  if (items.length === 0) return;
  if (items.length > MAX_ITEMS) {
    throw new Error(`A transaction can contain at most ${MAX_ITEMS} items`);
  }

  for (let attempt = 1; ; attempt++) {
    try {
      await dynamodb.send(new TransactWriteCommand({ TransactItems: items }));
      return;
    } catch (error) {
      if (isConditionalCheckFailure(error)) throw error;
      if (attempt < MAX_ATTEMPTS && hasCancellationReason(error, "TransactionConflict")) {
        await sleep(Math.random() * RETRY_BASE_MS * 2 ** attempt);
        continue;
      }
      throw appErrors.transactWriteError(error instanceof Error ? error.message : error);
    }
  }
}

export function isConditionalCheckFailure(error: unknown): boolean {
  return (
    error instanceof ConditionalCheckFailedException ||
    hasCancellationReason(error, "ConditionalCheckFailed")
  );
}

function hasCancellationReason(error: unknown, code: string): boolean {
  return (
    error instanceof TransactionCanceledException &&
    (error.CancellationReasons?.some((reason) => reason.Code === code) ?? false)
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
