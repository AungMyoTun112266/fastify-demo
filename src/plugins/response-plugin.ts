import type { FastifyPluginCallback, FastifyReply } from "fastify";
import fp from "fastify-plugin";

import type { ApiSuccess } from "../shared/types/api-response.js";

declare module "fastify" {
  interface FastifyReply {
    success<T>(data: T, statusCode?: number): FastifyReply;
  }
}

const responsePlugin: FastifyPluginCallback = (app, _options, done) => {
  app.decorateReply("success", function <
    T,
  >(this: FastifyReply, data: T, statusCode = 200) {
    const response: ApiSuccess<T> = {
      success: true,
      data,
    };

    return this.code(statusCode).send(response);
  });
  done();
};

export default fp(responsePlugin, {
  name: "response-plugin",
});
