import {
  DeleteCommand,
  GetCommand,
  PutCommand,
  QueryCommand,
  ScanCommand,
  UpdateCommand,
  type DeleteCommandInput,
  type GetCommandInput,
  type PutCommandInput,
  type QueryCommandInput,
  type ScanCommandInput,
  type UpdateCommandInput,
} from "@aws-sdk/lib-dynamodb";

import { dynamodb } from "./client.js";
import {
  coerce,
  type DynamoDBExpressionOptions,
  type DynamoDBItem,
  type DynamoDBKey,
  type QueryItemsParams,
  type QueryPageResult,
  type ScanItemsParams,
  type SetExpression,
  type UpdateItemParams,
} from "./types.js";

export function buildSetExpression(
  attributes: Record<string, unknown>,
): SetExpression {
  const expressionAttributeNames: Record<string, string> = {};
  const expressionAttributeValues: DynamoDBItem = {};
  const assignments: string[] = [];

  for (const [attribute, value] of Object.entries(attributes)) {
    if (value === undefined) {
      continue;
    }

    expressionAttributeNames[`#${attribute}`] = attribute;
    expressionAttributeValues[`:${attribute}`] = value;
    assignments.push(`#${attribute} = :${attribute}`);
  }

  if (assignments.length === 0) {
    throw new Error("A SET expression needs at least one defined attribute");
  }

  return {
    updateExpression: `SET ${assignments.join(", ")}`,
    expressionAttributeNames,
    expressionAttributeValues,
  };
}

export async function getItem<T>(
  tableName: string,
  key: DynamoDBKey,
  options?: {
    consistentRead?: boolean;
  },
): Promise<T | null> {
  const params: GetCommandInput = {
    TableName: tableName,
    Key: key,
    ConsistentRead: options?.consistentRead,
  };
  const result = await dynamodb.send(new GetCommand(params));
  return coerce<T | undefined>(result.Item) ?? null;
}

export async function putItem<T>(
  tableName: string,
  item: T,
  options?: DynamoDBExpressionOptions,
): Promise<void> {
  const params: PutCommandInput = {
    TableName: tableName,
    Item: coerce<Record<string, unknown>>(item),
    ConditionExpression: options?.conditionExpression,
    ExpressionAttributeNames: options?.expressionAttributeNames,
    ExpressionAttributeValues: options?.expressionAttributeValues,
  };

  await dynamodb.send(new PutCommand(params));
}

export async function updateItem<T>(
  tableName: string,
  params: UpdateItemParams,
): Promise<T | null> {
  const input: UpdateCommandInput = {
    TableName: tableName,
    Key: params.key,
    UpdateExpression: params.updateExpression,
    ExpressionAttributeValues: params.expressionAttributeValues,
    ExpressionAttributeNames: params.expressionAttributeNames,
    ConditionExpression: params.conditionExpression,
    ReturnValues: "ALL_NEW",
  };

  const result = await dynamodb.send(new UpdateCommand(input));
  return coerce<T | undefined>(result.Attributes) ?? null;
}

export async function deleteItem(
  tableName: string,
  key: DynamoDBKey,
  options?: DynamoDBExpressionOptions,
): Promise<void> {
  const params: DeleteCommandInput = {
    TableName: tableName,
    Key: key,
    ConditionExpression: options?.conditionExpression,
    ExpressionAttributeNames: options?.expressionAttributeNames,
    ExpressionAttributeValues: options?.expressionAttributeValues,
  };
  await dynamodb.send(new DeleteCommand(params));
}

export async function queryItems<T>(
  tableName: string,
  params: QueryItemsParams,
): Promise<QueryPageResult<T>> {
  const input: QueryCommandInput = {
    TableName: tableName,
    IndexName: params.indexName,
    KeyConditionExpression: params.keyConditionExpression,
    ExpressionAttributeValues: params.expressionAttributeValues,
    ExpressionAttributeNames: params.expressionAttributeNames,
    FilterExpression: params.filterExpression,
    ProjectionExpression: params.projectionExpression,
    Limit: params.limit,
    ExclusiveStartKey: params.exclusiveStartKey,
    ScanIndexForward: params.scanIndexForward,
    ConsistentRead: params.consistentRead,
  };

  const result = await dynamodb.send(new QueryCommand(input));

  return {
    items: coerce<T[]>(result.Items ?? []),
    ...(result.LastEvaluatedKey !== undefined
      ? { lastEvaluatedKey: result.LastEvaluatedKey }
      : {}),
  };
}

export async function queryAllItems<T>(
  tableName: string,
  params: Omit<QueryItemsParams, "exclusiveStartKey" | "limit">,
): Promise<T[]> {
  const allItems: T[] = [];
  let exclusiveStartKey: DynamoDBKey | undefined;

  do {
    const result = await queryItems<T>(tableName, {
      ...params,
      ...(exclusiveStartKey !== undefined ? { exclusiveStartKey } : {}),
    });

    allItems.push(...result.items);
    exclusiveStartKey = result.lastEvaluatedKey;
  } while (exclusiveStartKey !== undefined);

  return allItems;
}

export async function scanItems<T>(
  tableName: string,
  params: ScanItemsParams = {},
): Promise<T[]> {
  const items: T[] = [];
  let exclusiveStartKey: DynamoDBKey | undefined;

  do {
    const input: ScanCommandInput = {
      TableName: tableName,
      FilterExpression: params.filterExpression,
      ExpressionAttributeNames: params.expressionAttributeNames,
      ExpressionAttributeValues: params.expressionAttributeValues,
      ExclusiveStartKey: exclusiveStartKey,
    };

    const result = await dynamodb.send(new ScanCommand(input));
    items.push(...coerce<T[]>(result.Items ?? []));
    exclusiveStartKey = result.LastEvaluatedKey;
  } while (exclusiveStartKey);

  return items;
}
