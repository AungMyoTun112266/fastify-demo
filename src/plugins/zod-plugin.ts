import fp from "fastify-plugin";
import {
  serializerCompiler,
  validatorCompiler,
  type FastifyPluginAsyncZod,
} from "fastify-type-provider-zod";

const zodPlugin: FastifyPluginAsyncZod = async (app) => {
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);
};

export default fp(zodPlugin, {
  name: "zod-plugin",
});
