import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import { userService } from "./user.service.js";
import {
  createUserSchema,
  userIdParamsSchema,
  userSchema,
  usersSchema,
} from "./user.schema.js";
import {
  apiFailureSchema,
  apiSuccessSchema,
} from "../../shared/schemas/api-response.schema.js";

const userRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get(
    "/",
    {
      schema: {
        response: {
          200: apiSuccessSchema(usersSchema),
        },
      },
    },
    async (_request, reply) => {
      const users = userService.getAllUsers();
      return reply.success(users);
    },
  );

  app.get(
    "/:user_id",
    {
      schema: {
        params: userIdParamsSchema,
        response: {
          200: apiSuccessSchema(userSchema),
        },
      },
    },
    async ({ params }, reply) => {
      const user = userService.getUserById(params.user_id);
      return reply.success(user);
    },
  );

  app.post(
    "/",
    {
      schema: {
        body: createUserSchema,
        response: {
          201: apiSuccessSchema(userSchema),
          409: apiFailureSchema,
          500: apiFailureSchema,
        },
      },
    },
    async (request, reply) => {
      const user = userService.createUser(request.body);
      return reply.success(user, 201);
    },
  );

  app.delete(
    "/:user_id",
    {
      schema: {
        params: userIdParamsSchema,
      },
    },
    async ({ params }, reply) => {
      userService.deleteUser(params.user_id);
      return reply.code(204).send();
    },
  );
};

export default userRoutes;
