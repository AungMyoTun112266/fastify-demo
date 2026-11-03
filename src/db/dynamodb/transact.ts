import { TransactionCanceledException } from "@aws-sdk/client-dynamodb";
import { TransactWriteCommand } from "@aws-sdk/lib-dynamodb";

import { appErrors } from "../../shared/errors/index.js";
import { dynamodb } from "./client.js";
import { type TransactWriteItem } from "./types.js";

const BATCH_SIZE = 80;
const MAX_RETRIES = 10;
const RETRY_BASE_MS = 25;
const RETRY_MAX_MS = 500;

export async function transactWrite(items: TransactWriteItem[]): Promise<void> {
  if (items.length === 0) {
    return;
  }

  const batches = chunk(items, BATCH_SIZE);
  for (const [index, batch] of batches.entries()) {
    try {
      await commitBatch(batch);
    } catch (error) {
      console.error(
        `[DynamoDB] TransactWrite batch ${index + 1} of ${batches.length} failed`,
      );
      throw error;
    }
  }
}

async function commitBatch(items: TransactWriteItem[]): Promise<void> {
  let attempt = 0;
  for (;;) {
    try {
      await dynamodb.send(new TransactWriteCommand({ TransactItems: items }));
      return;
    } catch (error) {
      logFailure(error, attempt);

      if (attempt < MAX_RETRIES && isRetryable(error)) {
        await sleep(backoffDelay(attempt));
        attempt += 1;
        continue;
      }
      if (isConditionalCheckFailure(error)) {
        throw error;
      }
      throw appErrors.transactWriteError(errorMessage(error));
    }
  }
}

export function isConditionalCheckFailure(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }
  return (
    error.name === "ConditionalCheckFailedException" ||
    hasReasonCode(error, "ConditionalCheckFailed") ||
    error.message.includes("ConditionalCheckFailed")
  );
}

function isRetryable(error: unknown): boolean {
  if (
    !(error instanceof Error) ||
    error.name !== "TransactionCanceledException"
  ) {
    return false;
  }
  if (matchesCancellation(error, "ConditionalCheckFailed")) {
    return false;
  }
  return (
    matchesCancellation(error, "TransactionConflict") ||
    matchesCancellation(error, "ThrottlingError") ||
    matchesCancellation(error, "ProvisionedThroughputExceeded")
  );
}

function matchesCancellation(error: Error, code: string): boolean {
  return hasReasonCode(error, code) || error.message.includes(code);
}

function hasReasonCode(error: unknown, code: string): boolean {
  if (!(error instanceof TransactionCanceledException)) {
    return false;
  }
  return (
    error.CancellationReasons?.some((reason) => reason.Code === code) ?? false
  );
}

function backoffDelay(attempt: number): number {
  const cap = Math.min(RETRY_MAX_MS, RETRY_BASE_MS * 2 ** attempt);
  return Math.floor(Math.random() * cap);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function chunk<T>(items: readonly T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

function logFailure(error: unknown, attempt: number): void {
  console.error(`[DynamoDB] TransactWrite failed (attempt ${attempt + 1})`);
  console.error(
    error instanceof Error
      ? { name: error.name, message: error.message }
      : error,
  );
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
