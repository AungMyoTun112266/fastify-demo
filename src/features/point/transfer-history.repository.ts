import {
  defineTable,
  type Condition,
  type Page,
} from "../../db/dynamodb/index.js";
import { buildCreateDateRange } from "./create-date-range.js";
import type {
  PointCollectTransfer,
  SearchMoneyPointHistoryParams,
  SearchUserPointHistoryParams,
  UserMoneyHistoryType,
} from "./point.types.js";

type Transfer = PointCollectTransfer;
type ReportAttribute = Extract<keyof Transfer, `report_${string}`>;

interface HistoryIndex {
  index: string;
  partition: Partial<Transfer>;
}

const INDEX = {
  byMoneyId: "money_id-create_date-index",
  byMoneyUsage: "money_id-used_flg-create_date-index",
  byMoneyExpire: "money_id-expired_flg-create_date-index",
  byUserMoneyId: "user_money_id-create_date-index",
} as const;

const USER_MONEY_INDEXES = {
  collect: {
    index: "user_money_id-report_collect-index",
    report: "report_collect",
  },
  used: { index: "user_money_id-report_use-index", report: "report_use" },
  expire: {
    index: "user_money_id-report_expire-index",
    report: "report_expire",
  },
  collect_used: {
    index: "user_money_id-report_collect_used-index",
    report: "report_collect_used",
  },
  collect_expired: {
    index: "user_money_id-report_collect_expired-index",
    report: "report_collect_expired",
  },
  used_expired: {
    index: "user_money_id-report_use_expired-index",
    report: "report_use_expired",
  },
} as const satisfies Record<
  Exclude<UserMoneyHistoryType, "all">,
  { index: string; report: ReportAttribute }
>;

const transfers = defineTable<Transfer, "transfer_id">({
  name: "point_transfer",
  key: ["transfer_id"],
});

function moneyIndex(params: SearchMoneyPointHistoryParams): HistoryIndex {
  const { moneyId, usedOnly, expireIncludeFlg } = params;

  if (usedOnly) {
    return {
      index: INDEX.byMoneyUsage,
      partition: { money_id: moneyId, used_flg: 1 },
    };
  }
  if (!expireIncludeFlg) {
    return {
      index: INDEX.byMoneyExpire,
      partition: { money_id: moneyId, expired_flg: 0 },
    };
  }
  return { index: INDEX.byMoneyId, partition: { money_id: moneyId } };
}

function userMoneyIndex(params: SearchUserPointHistoryParams): HistoryIndex {
  const { userMoneyId, historyType } = params;

  if (historyType === "all") {
    return {
      index: INDEX.byUserMoneyId,
      partition: { user_money_id: userMoneyId },
    };
  }
  const { index, report } = USER_MONEY_INDEXES[historyType];
  const partition: Partial<Transfer> = { user_money_id: userMoneyId };
  partition[report] = 1;
  return { index, partition };
}

function optionalFilter(
  params: SearchMoneyPointHistoryParams | SearchUserPointHistoryParams,
): Condition<Transfer> | undefined {
  const filters: Condition<Transfer>[] = [];

  if (params.orgId !== undefined)
    filters.push({ attribute: "org_id", equals: params.orgId });
  if (params.mainChannel !== undefined)
    filters.push({ attribute: "main_channel", equals: params.mainChannel });
  if (params.campaignId !== undefined)
    filters.push({ attribute: "campaign_id", equals: params.campaignId });
  if (params.campaignName !== undefined)
    filters.push({ attribute: "campaign_name", contains: params.campaignName });

  return filters.length > 0 ? { and: filters } : undefined;
}

function queryHistory(
  { index, partition }: HistoryIndex,
  params: SearchMoneyPointHistoryParams | SearchUserPointHistoryParams,
): Promise<Page<Transfer>> {
  return transfers.query({
    index,
    partition,
    sort: buildCreateDateRange(params.fromDate, params.toDate, "calendar-day"),
    filter: optionalFilter(params),
    descending: true,
    limit: params.limit,
    cursor: params.cursor,
    maxPages: params.maxFilterPages,
  });
}

export const pointTransferHistoryRepository = {
  getByMoneyHistory(
    params: SearchMoneyPointHistoryParams,
  ): Promise<Page<Transfer>> {
    return queryHistory(moneyIndex(params), params);
  },

  getByUserMoneyHistory(
    params: SearchUserPointHistoryParams,
  ): Promise<Page<Transfer>> {
    return queryHistory(userMoneyIndex(params), params);
  },
};
