import type { TransactWriteCommandInput } from "@aws-sdk/lib-dynamodb";

export type DynamoDBItem = Record<string, unknown>;
export type DynamoDBKey = Record<string, unknown>;
export type TransactWriteItem = NonNullable<
  TransactWriteCommandInput["TransactItems"]
>[number];

export function coerce<T>(value: unknown): T;
export function coerce(value: unknown): unknown {
  return value;
}

export interface DynamoDBExpressionOptions {
  conditionExpression?: string;
  expressionAttributeNames?: Record<string, string>;
  expressionAttributeValues?: DynamoDBItem;
}

export interface UpdateItemParams extends DynamoDBExpressionOptions {
  key: DynamoDBKey;
  updateExpression: string;
}

export interface QueryItemsParams {
  keyConditionExpression: string;
  expressionAttributeValues: DynamoDBItem;
  expressionAttributeNames?: Record<string, string>;
  filterExpression?: string;
  projectionExpression?: string;
  indexName?: string;
  limit?: number;
  exclusiveStartKey?: DynamoDBKey;
  scanIndexForward?: boolean;
  consistentRead?: boolean;
}

export interface QueryPageResult<T> {
  items: T[];
  lastEvaluatedKey?: DynamoDBKey;
}

export interface QueryItemsResult<T> {
  items: T[];
  cursor?: string;
}

export interface ScanItemsParams {
  filterExpression?: string;
  expressionAttributeNames?: Record<string, string>;
  expressionAttributeValues?: DynamoDBItem;
}

export interface SetExpression {
  updateExpression: string;
  expressionAttributeNames: Record<string, string>;
  expressionAttributeValues: DynamoDBItem;
}
