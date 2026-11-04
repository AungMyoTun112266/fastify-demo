import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

import { appErrors } from "../../shared/errors/errors.js";
import { env } from "../../config/env.js";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;

const key = Buffer.from(env.PRODUCT_ENCRYPTION_KEY, "hex");

export const encryptProductResponse = (payload: string): string => {
  const iv = randomBytes(IV_LENGTH);

  const cipher = createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(payload, "utf8"),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  return [
    iv.toString("hex"),
    authTag.toString("hex"),
    encrypted.toString("hex"),
  ].join(":");
};

export const decryptProductRequest = (payload: unknown): unknown => {
  if (
    typeof payload !== "object" ||
    payload === null ||
    !("data" in payload) ||
    typeof payload.data !== "string"
  ) {
    throw appErrors.validationFailed();
  }

  const parts = payload.data.split(":");

  if (parts.length !== 3) {
    throw appErrors.validationFailed();
  }

  const [ivHex, authTagHex, encryptedHex] = parts;

  if (
    ivHex === undefined ||
    authTagHex === undefined ||
    encryptedHex === undefined ||
    !/^[0-9a-fA-F]{24}$/.test(ivHex) ||
    !/^[0-9a-fA-F]{32}$/.test(authTagHex) ||
    encryptedHex.length % 2 !== 0 ||
    !/^[0-9a-fA-F]*$/.test(encryptedHex)
  ) {
    throw appErrors.validationFailed();
  }

  try {
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");
    const encrypted = Buffer.from(encryptedHex, "hex");

    const decipher = createDecipheriv(ALGORITHM, key, iv);

    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]);

    const parsed: unknown = JSON.parse(decrypted.toString("utf8"));
    return parsed;
  } catch {
    throw appErrors.validationFailed();
  }
};
