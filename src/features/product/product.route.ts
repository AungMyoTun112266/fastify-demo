import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import productCryptoPlugin from "../../plugins/product-crypto-plugin.js";
import { pointTransferAvailableRepository } from "../point/transfer-available.repository.js";
import type { UserMoneyId } from "../point/point.types.js";
import { Brand } from "../../shared/types/brand.js";
import { ExpireDate } from "../../shared/types/expire-date.js";

const productRoutes: FastifyPluginAsyncZod = async (app) => {
  await app.register(productCryptoPlugin);

  app.get("/", async (_request, reply) => {
    const userMoneyId: UserMoneyId = Brand.create<string, "UserMoneyId">(
      "01a066f7-fd23-726a-9a01-1ef3f2ad812a#111edcbd-d42f-41d5-b80e-fcbb9b253982",
    );
    const expireDate = ExpireDate.create("2024-06-01");
    console.log("userMoneyId", userMoneyId);
    try {
      const result = await pointTransferAvailableRepository.getAvailablePoints(
        userMoneyId,
        expireDate,
      );
      console.log("result", result);
    } catch (e) {
      console.error("Error occurred:", e);
    }

    return reply.success("Hello, World!");
  });
};

export default productRoutes;
