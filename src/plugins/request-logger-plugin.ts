import type { FastifyPluginCallback } from "fastify";
import fp from "fastify-plugin";

import { logger } from "../shared/logger/index.js";

const requestLoggerPlugin: FastifyPluginCallback = (app, _options, done) => {
  //   app.addHook("onRequest", async (request) => {
  //     logger.info(
  //       {
  //         method: request.method,
  //         url: request.url,
  //         headers: request.headers,
  //         requestContext: request.requestContext,
  //       },
  //       "Incoming request",
  //     );
  //   });
  app.addHook("preHandler", (request, _reply, next) => {
    logger.info(
      {
        method: request.method,
        url: request.url,
        params: request.params,
        query: request.query,
        body: request.body,
        headers: request.headers,
      },
      "Incoming request",
    );
    next();
  });
  app.addHook("onSend", async (request, reply, payload) => {
    logger.info(
      {
        method: request.method,
        url: request.url,
        statusCode: reply.statusCode,
        body: payload,
      },
      "Outgoing response",
    );

    return payload;
  });
  done();
};

export default fp(requestLoggerPlugin, {
  name: "request-logger-plugin",
});
