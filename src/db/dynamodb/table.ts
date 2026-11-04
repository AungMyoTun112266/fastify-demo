import {
  DeleteCommand,
  GetCommand,
  PutCommand,
  QueryCommand,
  ScanCommand,
  UpdateCommand,
  type QueryCommandInput,
} from "@aws-sdk/lib-dynamodb";

import { dynamodb } from "./client.js";
import { buildCondition, type Condition, type SortKeyCondition } from "./condition.js";
import { decodeCursor, encodeCursor } from "./cursor.js";
import { ExpressionAttributes } from "./expression.js";
import type { TransactionItem } from "./transaction.js";
import { buildUpdate, type Update } from "./update.js";

type PutInput = NonNullable<TransactionItem["Put"]>;
type UpdateInput = NonNullable<TransactionItem["Update"]>;
type DeleteInput = NonNullable<TransactionItem["Delete"]>;

export interface TableConfig<K extends string> {
  name: string;
  key: readonly [K] | readonly [K, K];
}

export interface WriteOptions<T> {
  condition?: Condition<T>;
}

export interface QueryOptions<T, P extends keyof T> {
  partition: Partial<T>;
  sort?: SortKeyCondition<T> | undefined;
  filter?: Condition<T> | undefined;
  select?: readonly P[] | undefined;
  index?: string | undefined;
  limit?: number | undefined;
  cursor?: string | undefined;
  maxPages?: number | undefined;
  descending?: boolean | undefined;
  consistent?: boolean | undefined;
}

export type QueryAllOptions<T, P extends keyof T> = Omit<
  QueryOptions<T, P>,
  "limit" | "cursor" | "maxPages"
>;

export interface Page<T> {
  items: T[];
  cursor?: string;
}

export interface Table<T, K extends keyof T> {
  name: string;
  get(key: Pick<T, K>, options?: { consistent?: boolean }): Promise<T | undefined>;
  put(item: T, options?: WriteOptions<T>): Promise<void>;
  create(item: T, options?: WriteOptions<T>): Promise<void>;
  update(key: Pick<T, K>, update: Update<Omit<T, K>>, options?: WriteOptions<T>): Promise<T>;
  delete(key: Pick<T, K>, options?: WriteOptions<T>): Promise<void>;
  query<P extends keyof T & string = keyof T & string>(
    options: QueryOptions<T, P>,
  ): Promise<Page<Pick<T, P>>>;
  queryAll<P extends keyof T & string = keyof T & string>(
    options: QueryAllOptions<T, P>,
  ): Promise<Pick<T, P>[]>;
  scan(options?: { filter?: Condition<T> }): Promise<T[]>;
  transaction: {
    put(item: T, options?: WriteOptions<T>): TransactionItem;
    create(item: T, options?: WriteOptions<T>): TransactionItem;
    update(key: Pick<T, K>, update: Update<Omit<T, K>>, options?: WriteOptions<T>): TransactionItem;
    delete(key: Pick<T, K>, options?: WriteOptions<T>): TransactionItem;
  };
}

function fromDynamo<T>(items: Record<string, unknown>[] | undefined): T[] {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- DynamoDB returns untyped items; T is trusted to match the table schema
  return (items ?? []) as T[];
}

function conditionInput(...clauses: (string | undefined)[]): { ConditionExpression?: string } {
  const expression = clauses.filter((clause) => clause !== undefined).join(" AND ");
  return expression === "" ? {} : { ConditionExpression: expression };
}

export function defineTable<T extends object, K extends keyof T & string>(
  config: TableConfig<K>,
): Table<T, K> {
  const TableName = config.name;
  const [partitionKey] = config.key;

  type Key = Pick<T, K>;
  type Fields = Omit<T, K>;

  function putInput(item: T, condition: Condition<T> | undefined, mustBeNew = false): PutInput {
    const attrs = new ExpressionAttributes();
    return {
      TableName,
      Item: item,
      ...conditionInput(
        mustBeNew ? `attribute_not_exists(${attrs.name(partitionKey)})` : undefined,
        condition && buildCondition(condition, attrs),
      ),
      ...attrs.toInput(),
    };
  }

  function updateInput(key: Key, update: Update<Fields>, condition?: Condition<T>): UpdateInput {
    const attrs = new ExpressionAttributes();
    return {
      TableName,
      Key: key,
      UpdateExpression: buildUpdate(update, attrs),
      ...conditionInput(
        `attribute_exists(${attrs.name(partitionKey)})`,
        condition && buildCondition(condition, attrs),
      ),
      ...attrs.toInput(),
    };
  }

  function deleteInput(key: Key, condition?: Condition<T>): DeleteInput {
    const attrs = new ExpressionAttributes();
    return {
      TableName,
      Key: key,
      ...conditionInput(condition && buildCondition(condition, attrs)),
      ...attrs.toInput(),
    };
  }

  function queryInput<P extends keyof T & string>(options: QueryOptions<T, P>): QueryCommandInput {
    const attrs = new ExpressionAttributes();

    const keyClauses = Object.entries(options.partition)
      .filter(([, value]) => value !== undefined)
      .map(([attribute, value]) => `${attrs.name(attribute)} = ${attrs.value(value)}`);
    if (keyClauses.length === 0) {
      throw new Error("query needs at least one partition key value");
    }
    if (options.sort) {
      keyClauses.push(buildCondition(options.sort, attrs));
    }

    return {
      TableName,
      KeyConditionExpression: keyClauses.join(" AND "),
      ...(options.filter && { FilterExpression: buildCondition(options.filter, attrs) }),
      ...(options.select && {
        ProjectionExpression: options.select.map((a) => attrs.name(a)).join(", "),
      }),
      ...(options.index !== undefined && { IndexName: options.index }),
      ...(options.cursor !== undefined && { ExclusiveStartKey: decodeCursor(options.cursor) }),
      ...(options.descending === true && { ScanIndexForward: false }),
      ...(options.consistent === true && { ConsistentRead: true }),
      ...attrs.toInput(),
    };
  }

  async function queryPages<P extends keyof T & string>(
    options: QueryOptions<T, P>,
  ): Promise<Page<Pick<T, P>>> {
    const input = queryInput(options);
    const { limit, maxPages = 1 } = options;
    const items: Pick<T, P>[] = [];
    let startKey = input.ExclusiveStartKey;

    for (let page = 0; page < maxPages; page++) {
      const result = await dynamodb.send(
        new QueryCommand({
          ...input,
          ExclusiveStartKey: startKey,
          ...(limit !== undefined && { Limit: limit - items.length }),
        }),
      );
      items.push(...fromDynamo<Pick<T, P>>(result.Items));
      startKey = result.LastEvaluatedKey;
      if (!startKey || (limit !== undefined && items.length >= limit)) {
        break;
      }
    }

    return { items, ...(startKey && { cursor: encodeCursor(startKey) }) };
  }

  return {
    name: TableName,

    async get(key, options = {}) {
      const result = await dynamodb.send(
        new GetCommand({ TableName, Key: key, ConsistentRead: options.consistent }),
      );
      return fromDynamo<T>(result.Item && [result.Item])[0];
    },

    async put(item, options = {}) {
      await dynamodb.send(new PutCommand(putInput(item, options.condition)));
    },

    async create(item, options = {}) {
      await dynamodb.send(new PutCommand(putInput(item, options.condition, true)));
    },

    async update(key, update, options = {}) {
      const result = await dynamodb.send(
        new UpdateCommand({
          ...updateInput(key, update, options.condition),
          ReturnValues: "ALL_NEW",
        }),
      );
      const [item] = fromDynamo<T>(result.Attributes && [result.Attributes]);
      if (item === undefined) {
        throw new Error("UpdateItem returned no attributes");
      }
      return item;
    },

    async delete(key, options = {}) {
      await dynamodb.send(new DeleteCommand(deleteInput(key, options.condition)));
    },

    query(options) {
      return queryPages(options);
    },

    async queryAll(options) {
      const page = await queryPages({ ...options, maxPages: Infinity });
      return page.items;
    },

    async scan(options = {}) {
      const attrs = new ExpressionAttributes();
      const filter = options.filter && buildCondition(options.filter, attrs);
      const items: T[] = [];
      let startKey: Record<string, unknown> | undefined;
      do {
        const result = await dynamodb.send(
          new ScanCommand({
            TableName,
            ...(filter !== undefined && { FilterExpression: filter }),
            ...attrs.toInput(),
            ExclusiveStartKey: startKey,
          }),
        );
        items.push(...fromDynamo<T>(result.Items));
        startKey = result.LastEvaluatedKey;
      } while (startKey);
      return items;
    },

    transaction: {
      put: (item, options = {}) => ({ Put: putInput(item, options.condition) }),
      create: (item, options = {}) => ({ Put: putInput(item, options.condition, true) }),
      update: (key, update, options = {}) => ({
        Update: updateInput(key, update, options.condition),
      }),
      delete: (key, options = {}) => ({ Delete: deleteInput(key, options.condition) }),
    },
  };
}
