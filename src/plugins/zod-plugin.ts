import fp from "fastify-plugin";
import {
  serializerCompiler,
  validatorCompiler,
  type FastifyPluginCallbackZod,
} from "fastify-type-provider-zod";

const zodPlugin: FastifyPluginCallbackZod = (app, _options, done) => {
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);
  done();
};

export default fp(zodPlugin, {
  name: "zod-plugin",
});
