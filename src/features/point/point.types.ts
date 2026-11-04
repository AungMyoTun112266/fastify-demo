import type { Brand } from "../../shared/types/brand.js";
import type { ExpireDate } from "../../shared/types/expire-date.js";

export type ExpireId = Brand<string, "ExpireId">;
export type UserMoneyId = Brand<string, "UserMoneyId">;
export type UserId = Brand<string, "UserId">;
export type MoneyId = Brand<string, "MoneyId">;
export type DateTime = Brand<string, "DateTime">;

export const SyncStatus = {
  PENDING: "PENDING",
  SYNCED: "SYNCED",
} as const;
export type SyncStatus = (typeof SyncStatus)[keyof typeof SyncStatus];

export const ExpireType = {
  AUTO: "AUTO",
  MANUAL: "MANUAL",
} as const;
export type ExpireType = (typeof ExpireType)[keyof typeof ExpireType];

export interface PointExpire {
  expire_id: ExpireId;
  user_money_id: UserMoneyId;
  expire_date: DateTime;

  user_id: UserId;
  money_id: MoneyId;

  amount: number;
  expire_type: ExpireType;
  create_date: DateTime;
  update_date: DateTime;
  sync_status: SyncStatus;
}

type Flag = 0 | 1;

export interface PointCollectTransfer {
  transfer_id: string;
  money_id: MoneyId;
  user_money_id: UserMoneyId;
  create_date: DateTime;

  org_id: number;
  main_channel: number;
  campaign_id: number;
  campaign_name: string;
  amount: number;

  used_flg: Flag;
  expired_flg: Flag;
  report_collect?: Flag;
  report_use?: Flag;
  report_expire?: Flag;
  report_collect_used?: Flag;
  report_collect_expired?: Flag;
  report_use_expired?: Flag;
}

export type UserMoneyHistoryType =
  | "all"
  | "collect"
  | "used"
  | "expire"
  | "collect_used"
  | "collect_expired"
  | "used_expired";

interface SearchHistoryParams {
  fromDate?: DateTime;
  toDate?: DateTime;
  orgId?: number;
  mainChannel?: number;
  campaignId?: number;
  campaignName?: string;
  limit: number;
  cursor?: string;
  maxFilterPages?: number;
}

export interface SearchMoneyPointHistoryParams extends SearchHistoryParams {
  moneyId: MoneyId;
  usedOnly: boolean;
  expireIncludeFlg: boolean;
}

export interface SearchUserPointHistoryParams extends SearchHistoryParams {
  userMoneyId: UserMoneyId;
  historyType: UserMoneyHistoryType;
}

export const BalanceType = {
  CREDIT: "credit",
  DEBIT: "debit",
} as const;
export type BalanceType = (typeof BalanceType)[keyof typeof BalanceType];

export interface AvailablePointTransfer {
  transfer_id: string;
  request_id: string;
  user_id: UserId;
  money_id: MoneyId;
  user_money_id: UserMoneyId;
  money_int_id: number;
  wallet_id: string;

  balance_type: BalanceType;
  transaction_type: string;
  point_amount: number;
  remain_amount: number;
  expire_date: ExpireDate;

  memberstore_id: string;
  channel: number;
  main_channel: number;
  org_id: number;
  org_name: string;
  campaign_id: number;
  campaign_name: string;

  cancel_flg: Flag;
  expired_flg: Flag;
}
