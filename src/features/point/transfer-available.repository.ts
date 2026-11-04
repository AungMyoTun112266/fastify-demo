import { defineTable } from "../../db/dynamodb/index.js";
import { ExpireDate } from "../../shared/types/expire-date.js";
import {
  BalanceType,
  type AvailablePointTransfer,
  type UserMoneyId,
} from "./point.types.js";

type Transfer = AvailablePointTransfer;

const COLLECT_ATTRIBUTES = [
  "transfer_id",
  "request_id",
  "user_id",
  "money_id",
  "transaction_type",
  "point_amount",
  "remain_amount",
  "expire_date",
  "memberstore_id",
  "channel",
  "main_channel",
  "money_int_id",
  "wallet_id",
  "org_id",
  "org_name",
  "campaign_name",
  "campaign_id",
] as const satisfies readonly (keyof Transfer)[];

const SUMMARY_ATTRIBUTES = ["expire_date", "remain_amount"] as const;

export type AvailableCollectTransfer = Pick<
  Transfer,
  (typeof COLLECT_ATTRIBUTES)[number]
>;
export type AvailablePointSummary = Pick<
  Transfer,
  (typeof SUMMARY_ATTRIBUTES)[number]
>;

type ExpireDateCondition =
  | { greaterThanOrEqual: ExpireDate }
  | { lessThan: ExpireDate }
  | { equals: ExpireDate };

const AVAILABLE_POINTS_INDEX = "available_points_index";

const transfers = defineTable<Transfer, "transfer_id">({
  name: "kiban-point-transfer-dev",
  key: ["transfer_id"],
});

function queryAvailable<P extends keyof Transfer>(
  userMoneyId: UserMoneyId,
  expireDate: ExpireDateCondition,
  select: readonly P[],
): Promise<Pick<Transfer, P>[]> {
  return transfers.queryAll({
    index: AVAILABLE_POINTS_INDEX,
    partition: {
      user_money_id: userMoneyId,
      balance_type: BalanceType.CREDIT,
      cancel_flg: 0,
      expired_flg: 0,
    },
    sort: { attribute: "expire_date", ...expireDate },
    filter: { attribute: "remain_amount", greaterThan: 0 },
    select,
  });
}

function sumRemaining(points: readonly AvailablePointSummary[]): number {
  return points.reduce((total, point) => total + point.remain_amount, 0);
}

export const pointTransferAvailableRepository = {
  getAvailableCollectTransfers(
    userMoneyId: UserMoneyId,
    currentDate: ExpireDate,
  ): Promise<AvailableCollectTransfer[]> {
    return queryAvailable(
      userMoneyId,
      { greaterThanOrEqual: currentDate },
      COLLECT_ATTRIBUTES,
    );
  },

  getExpiringPoints(
    userMoneyId: UserMoneyId,
    expireDate: ExpireDate,
  ): Promise<AvailableCollectTransfer[]> {
    return queryAvailable(
      userMoneyId,
      { equals: expireDate },
      COLLECT_ATTRIBUTES,
    );
  },

  getAvailablePoints(
    userMoneyId: UserMoneyId,
    currentDate: ExpireDate,
  ): Promise<AvailablePointSummary[]> {
    return queryAvailable(
      userMoneyId,
      { greaterThanOrEqual: currentDate },
      SUMMARY_ATTRIBUTES,
    );
  },

  async getExpiredPoints(userMoneyId: UserMoneyId): Promise<number> {
    const points = await queryAvailable(
      userMoneyId,
      { lessThan: ExpireDate.now() },
      SUMMARY_ATTRIBUTES,
    );
    return sumRemaining(points);
  },
};
