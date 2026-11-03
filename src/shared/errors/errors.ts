import { AppError } from "./types.js";

export const appErrors = {
  notFound: () =>
    new AppError({
      statusCode: 404,
      code: 404,
      message: "※ 対象のデータが見つかりません。",
    }),

  duplicateRequest: () =>
    new AppError({
      statusCode: 409,
      code: 1113,
      message: "リクエストIDが既に使用されています。",
    }),

  internal: () =>
    new AppError({
      statusCode: 500,
      code: 500,
      message: "内部でエラーが発生しました。",
    }),

  validationFailed: () =>
    new AppError({
      statusCode: 400,
      code: 400,
      message: "入力内容に誤りがあります。",
    }),

  secretNotFound: () =>
    new AppError({
      statusCode: 400,
      code: 500,
      message: "シークレットが見つかりません。",
    }),

  invalidCursor: () =>
    new AppError({
      statusCode: 400,
      code: 400,
      message: "無効なカーソルです。",
    }),
  envInvalid: (error?: unknown) =>
    new AppError({
      statusCode: 500,
      code: 500,
      message: `環境変数の設定が正しくありません。${String(error)}`,
    }),
} as const;
