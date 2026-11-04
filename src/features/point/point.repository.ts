import {
  defineTable,
  type Page,
  type TransactionItem,
} from "../../db/dynamodb/index.js";
import { buildCreateDateRange } from "./create-date-range.js";
import {
  SyncStatus,
  type DateTime,
  type ExpireId,
  type PointExpire,
  type UserMoneyId,
} from "./point.types.js";

const INDEX = {
  bySyncStatus: "sync_status-create_date-index",
  byUserMoneyId: "user_money_id-create_date-index",
} as const;

const pointExpires = defineTable<PointExpire, "expire_id" | "create_date">({
  name: "point_expire",
  key: ["expire_id", "create_date"],
});

export const pointExpireRepository = {
  prepareCreate(expire: PointExpire): TransactionItem {
    return pointExpires.transaction.create(expire);
  },

  getPendingExpires(params: {
    limit: number;
    cursor?: string;
  }): Promise<Page<PointExpire>> {
    return pointExpires.query({
      index: INDEX.bySyncStatus,
      partition: { sync_status: SyncStatus.PENDING },
      limit: params.limit,
      cursor: params.cursor,
    });
  },

  getExpiredPoints(params: {
    userMoneyId: UserMoneyId;
    fromDate?: DateTime;
    toDate?: DateTime;
    limit: number;
    cursor?: string;
  }): Promise<Page<PointExpire>> {
    return pointExpires.query({
      index: INDEX.byUserMoneyId,
      partition: { user_money_id: params.userMoneyId },
      sort: buildCreateDateRange(params.fromDate, params.toDate),
      descending: true,
      limit: params.limit,
      cursor: params.cursor,
    });
  },

  async markSynced(key: {
    expireId: ExpireId;
    createDate: DateTime;
  }): Promise<void> {
    await pointExpires.update(
      { expire_id: key.expireId, create_date: key.createDate },
      { set: { sync_status: SyncStatus.SYNCED } },
    );
  },
};
