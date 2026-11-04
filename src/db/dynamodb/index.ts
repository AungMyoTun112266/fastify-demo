export { dynamodb } from "./client.js";
export { defineTable } from "./table.js";
export type { Page, QueryOptions, TableConfig, WriteOptions } from "./table.js";
export type { Condition, SortKeyCondition } from "./condition.js";
export type { Update } from "./update.js";
export { isConditionalCheckFailure, transactWrite } from "./transaction.js";
export type { TransactionItem } from "./transaction.js";
