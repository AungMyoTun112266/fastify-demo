import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import userRoutes from "../features/user/user.route.js";
import productRoutes from "../features/product/product.route.js";

const routes: FastifyPluginAsyncZod = async (app) => {
  await app.register(userRoutes, {
    prefix: "/users",
  });
  await app.register(productRoutes, {
    prefix: "/products",
  });
};

export default routes;
