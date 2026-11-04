import fp from "fastify-plugin";
import type { FastifyPluginCallback, FastifyError } from "fastify";

import { AppError, appErrors } from "../shared/errors/index.js";

const errorPlugin: FastifyPluginCallback = (app, _options, done) => {
  app.setErrorHandler((error: FastifyError, request, reply) => {
    if (error instanceof AppError) {
      request.log.warn(error);

      return reply.code(error.statusCode).send({
        success: false,
        message: error.message,
        error: {
          code: error.code,
        },
      });
    }

    if (error.validation) {
      const validationError = appErrors.validationFailed();

      return reply.code(validationError.statusCode).send({
        success: false,
        message: validationError.message,
        // error: {
        //   code: validationError.code,
        // },
      });
    }

    request.log.error(error);
    const internalError = appErrors.internal();
    return reply.code(internalError.statusCode).send({
      success: false,
      message: internalError.message,
      // error: {
      //   code: internalError.code,
      // },
    });
  });
  done();
};

export default fp(errorPlugin, {
  name: "error-plugin",
});
