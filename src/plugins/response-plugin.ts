import type { FastifyPluginAsync, FastifyReply } from "fastify";
import fp from "fastify-plugin";

import type { ApiSuccess } from "../shared/types/api-response.js";

declare module "fastify" {
  interface FastifyReply {
    success<T>(data: T, statusCode?: number): FastifyReply;
  }
}

const responsePlugin: FastifyPluginAsync = async (app) => {
  app.decorateReply("success", function <
    T,
  >(this: FastifyReply, data: T, statusCode = 200) {
    const response: ApiSuccess<T> = {
      success: true,
      data,
    };

    return this.code(statusCode).send(response);
  });
};

export default fp(responsePlugin, {
  name: "response-plugin",
});
