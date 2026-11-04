import type { FastifyPluginCallback } from "fastify";
import fp from "fastify-plugin";
import {
  encryptProductResponse,
  decryptProductRequest,
} from "../features/product/product.crypto.js";

const productCryptoPlugin: FastifyPluginCallback = (app, _options, done) => {
  app.addHook("preValidation", (request, _reply, next) => {
    if (request.body !== undefined) {
      request.body = decryptProductRequest(request.body);
    }
    next();
  });

  app.addHook("onSend", (request, reply, payload, next) => {
    if (
      reply.statusCode === 204 ||
      request.method === "HEAD" ||
      typeof payload !== "string" ||
      payload === ""
    ) {
      next(null, payload);
      return;
    }

    const encrypted = encryptProductResponse(payload);
    reply.header("content-type", "application/json; charset=utf-8");
    next(null, JSON.stringify({ success: true, data: encrypted }));
  });
  done();
};

export default fp(productCryptoPlugin, {
  name: "product-crypto-plugin",
});
