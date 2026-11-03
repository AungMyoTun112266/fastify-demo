import { z } from "zod";

import { appErrors } from "../shared/errors/errors.js";

const envSchema = z.object({
  AWS_REGION: z.string().default("ap-northeast-1"),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  PRODUCT_ENCRYPTION_KEY: z.string().regex(/^[0-9a-fA-F]{64}$/, {
    message: "PRODUCT_ENCRYPTION_KEY must be a 64-character hex string",
  }),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  throw appErrors.envInvalid(parsedEnv.error.format());
}

export const env = Object.freeze(parsedEnv.data);
