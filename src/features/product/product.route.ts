import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import productCryptoPlugin from "../../plugins/product-crypto-plugin.js";

const productRoutes: FastifyPluginAsyncZod = async (app) => {
  await app.register(productCryptoPlugin);

  app.get("/", async (_request, reply) => {
    const products = [
      { product_id: "1", name: "Product A" },
      { product_id: "2", name: "Product B" },
    ];
    return reply.success(products);
  });
};

export default productRoutes;
