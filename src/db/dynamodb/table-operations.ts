import {
  putItem,
  queryAllItems,
  queryItems,
  scanItems,
  updateItem,
} from "./commands.js";
import { decodeCursor, encodeCursor } from "./cursor.js";
import { createAliasRegistry } from "./expression.js";
import type { Filter } from "./filter.js";
import { compileFilter } from "./filter.js";
import type { KeyCondition } from "./key-condition.js";
import { compileKeyCondition } from "./key-condition.js";
import {
  coerce,
  type DynamoDBItem,
  type DynamoDBKey,
  type QueryItemsResult,
  type TransactWriteItem,
} from "./types.js";
import type { UpdateCondition, UpdateOperations } from "./update.js";
import { compileCondition, compileUpdate } from "./update.js";

export function applyUpdate<T>(
  tableName: string,
  params: {
    key: DynamoDBKey;
    ops: UpdateOperations<T>;
    condition?: UpdateCondition<T>;
  },
): Promise<T | null> {
  const compiled = compileUpdate(params.ops, params.condition);

  return updateItem<T>(tableName, {
    key: params.key,
    updateExpression: compiled.updateExpression,
    expressionAttributeNames: compiled.expressionAttributeNames,
    expressionAttributeValues: compiled.expressionAttributeValues,
    ...(compiled.conditionExpression !== undefined
      ? { conditionExpression: compiled.conditionExpression }
      : {}),
  });
}
const FILTER_AWARE_MAX_PAGES = 10;

function compileProjection(attributes: readonly string[]): {
  projectionExpression: string;
  expressionAttributeNames: Record<string, string>;
} {
  const names: Record<string, string> = {};
  const aliases: string[] = [];
  for (const attribute of attributes) {
    const alias = `#${attribute}`;
    names[alias] = attribute;
    aliases.push(alias);
  }
  return {
    projectionExpression: aliases.join(", "),
    expressionAttributeNames: names,
  };
}

export async function queryBy<T>(
  tableName: string,
  params: {
    key: KeyCondition<T>;
    filter?: Filter<T>;
    projection?: ReadonlyArray<keyof T & string>;
    indexName?: string;
    limit?: number;
    cursor?: string;
    scanIndexForward?: boolean;
    consistentRead?: boolean;
    maxFilterPages?: number;
  },
): Promise<QueryItemsResult<T>> {
  const keyExpression = compileKeyCondition(params.key);
  const filterExpression = params.filter ? compileFilter(params.filter) : null;
  const projection = params.projection
    ? compileProjection(params.projection)
    : null;

  const baseInput = {
    keyConditionExpression: keyExpression.expression,

    expressionAttributeNames: {
      ...keyExpression.expressionAttributeNames,
      ...filterExpression?.expressionAttributeNames,
      ...projection?.expressionAttributeNames,
    },

    expressionAttributeValues: {
      ...keyExpression.expressionAttributeValues,
      ...filterExpression?.expressionAttributeValues,
    },

    ...(filterExpression !== null
      ? { filterExpression: filterExpression.expression }
      : {}),

    ...(projection !== null
      ? { projectionExpression: projection.projectionExpression }
      : {}),

    ...(params.indexName !== undefined ? { indexName: params.indexName } : {}),

    ...(params.scanIndexForward !== undefined
      ? { scanIndexForward: params.scanIndexForward }
      : {}),

    ...(params.consistentRead !== undefined
      ? { consistentRead: params.consistentRead }
      : {}),
  };

  let exclusiveStartKey =
    params.cursor !== undefined ? decodeCursor(params.cursor) : undefined;

  if (filterExpression === null || params.limit === undefined) {
    const result = await queryItems<T>(tableName, {
      ...baseInput,
      ...(params.limit !== undefined ? { limit: params.limit } : {}),
      ...(exclusiveStartKey !== undefined ? { exclusiveStartKey } : {}),
    });
    return toQueryItemsResult(result.items, result.lastEvaluatedKey);
  }

  const maxPages = params.maxFilterPages ?? FILTER_AWARE_MAX_PAGES;
  const collected: T[] = [];

  for (let page = 0; page < maxPages; page += 1) {
    const remaining = params.limit - collected.length;
    const result = await queryItems<T>(tableName, {
      ...baseInput,
      limit: Math.max(1, remaining),
      ...(exclusiveStartKey !== undefined ? { exclusiveStartKey } : {}),
    });
    collected.push(...result.items);
    exclusiveStartKey = result.lastEvaluatedKey;

    if (exclusiveStartKey === undefined || collected.length >= params.limit) {
      break;
    }
  }

  return toQueryItemsResult(collected, exclusiveStartKey);
}

function toQueryItemsResult<T>(
  items: T[],
  lastEvaluatedKey: DynamoDBKey | undefined,
): QueryItemsResult<T> {
  return {
    items,
    ...(lastEvaluatedKey !== undefined
      ? { cursor: encodeCursor(lastEvaluatedKey) }
      : {}),
  };
}

export function queryAll<T, TProj = T>(
  tableName: string,
  params: {
    key: KeyCondition<T>;
    filter?: Filter<T>;
    projection?: ReadonlyArray<keyof T & string>;
    indexName?: string;
    scanIndexForward?: boolean;
    consistentRead?: boolean;
  },
): Promise<TProj[]> {
  const keyExpression = compileKeyCondition(params.key);
  const filterExpression = params.filter ? compileFilter(params.filter) : null;

  const projection = params.projection
    ? compileProjection(params.projection)
    : null;

  return queryAllItems<TProj>(tableName, {
    keyConditionExpression: keyExpression.expression,

    expressionAttributeNames: {
      ...keyExpression.expressionAttributeNames,
      ...filterExpression?.expressionAttributeNames,
      ...projection?.expressionAttributeNames,
    },

    expressionAttributeValues: {
      ...keyExpression.expressionAttributeValues,
      ...filterExpression?.expressionAttributeValues,
    },

    ...(filterExpression !== null
      ? { filterExpression: filterExpression.expression }
      : {}),

    ...(projection !== null
      ? { projectionExpression: projection.projectionExpression }
      : {}),

    ...(params.indexName !== undefined ? { indexName: params.indexName } : {}),

    ...(params.scanIndexForward !== undefined
      ? { scanIndexForward: params.scanIndexForward }
      : {}),

    ...(params.consistentRead !== undefined
      ? { consistentRead: params.consistentRead }
      : {}),
  });
}

export function scanBy<T>(
  tableName: string,
  params: { filter?: Filter<T> } = {},
): Promise<T[]> {
  const filterExpression = params.filter ? compileFilter(params.filter) : null;

  return scanItems<T>(tableName, {
    ...(filterExpression !== null
      ? {
          filterExpression: filterExpression.expression,
          expressionAttributeNames: filterExpression.expressionAttributeNames,
          expressionAttributeValues: filterExpression.expressionAttributeValues,
        }
      : {}),
  });
}

interface CompiledCreateCondition {
  conditionExpression?: string;
  expressionAttributeNames?: Record<string, string>;
  expressionAttributeValues?: DynamoDBItem;
}

function compileCreateCondition<T>(
  condition: UpdateCondition<T>,
): CompiledCreateCondition {
  const registry = createAliasRegistry();
  const conditionExpression = compileCondition(condition, registry);

  return {
    ...(conditionExpression !== undefined ? { conditionExpression } : {}),

    ...(Object.keys(registry.names).length > 0
      ? { expressionAttributeNames: registry.names }
      : {}),

    ...(Object.keys(registry.values).length > 0
      ? { expressionAttributeValues: registry.values }
      : {}),
  };
}

export function applyPut<T>(
  tableName: string,
  item: T,
  params?: { condition?: UpdateCondition<T> },
): Promise<void> {
  const compiled = params?.condition
    ? compileCreateCondition(params.condition)
    : {};
  return putItem<T>(tableName, item, compiled);
}

export function buildTransactCreate<T>(
  tableName: string,
  item: T,
  params: { condition: UpdateCondition<T> },
): TransactWriteItem {
  const compiled = compileCreateCondition(params.condition);
  return {
    Put: {
      TableName: tableName,
      Item: coerce<DynamoDBItem>(item),
      ConditionExpression: compiled.conditionExpression,
      ExpressionAttributeNames: compiled.expressionAttributeNames,
      ExpressionAttributeValues: compiled.expressionAttributeValues,
    },
  };
}

export function buildTransactUpdate<T>(
  tableName: string,
  params: {
    key: DynamoDBKey;
    ops: UpdateOperations<T>;
    condition?: UpdateCondition<T>;
  },
): TransactWriteItem {
  const compiled = compileUpdate(params.ops, params.condition);
  return {
    Update: {
      TableName: tableName,
      Key: params.key,
      UpdateExpression: compiled.updateExpression,
      ExpressionAttributeNames: compiled.expressionAttributeNames,
      ExpressionAttributeValues: compiled.expressionAttributeValues,
      ConditionExpression: compiled.conditionExpression,
    },
  };
}

export function buildTransactDelete(
  tableName: string,
  key: DynamoDBKey,
  options?: {
    conditionExpression?: string;
    expressionAttributeNames?: Record<string, string>;
    expressionAttributeValues?: DynamoDBItem;
  },
): TransactWriteItem {
  return {
    Delete: {
      TableName: tableName,
      Key: key,
      ConditionExpression: options?.conditionExpression,
      ExpressionAttributeNames: options?.expressionAttributeNames,
      ExpressionAttributeValues: options?.expressionAttributeValues,
    },
  };
}
