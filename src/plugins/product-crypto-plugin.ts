import type { FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin";
import {
  encryptProductResponse,
  decryptProductRequest,
} from "../features/product/product.crypto.js";

const productCryptoPlugin: FastifyPluginAsync = async (app) => {
  app.addHook("preValidation", async (request) => {
    if (request.body === undefined) return;
    request.body = await decryptProductRequest(request.body);
  });

  app.addHook("onSend", async (request, reply, payload) => {
    if (
      reply.statusCode === 204 ||
      request.method === "HEAD" ||
      !payload ||
      typeof payload !== "string"
    ) {
      return payload;
    }

    const encrypted = await encryptProductResponse(payload);
    reply.header("content-type", "application/json; charset=utf-8");
    return JSON.stringify({
      success: true,
      data: encrypted,
    });
  });
};

export default fp(productCryptoPlugin, {
  name: "product-crypto-plugin",
});
