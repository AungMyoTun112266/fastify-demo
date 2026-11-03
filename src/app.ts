import Fastify from "fastify";

import routes from "./routes/index.js";
import zodPlugin from "./plugins/zod-plugin.js";
import errorPlugin from "./plugins/error-plugin.js";
import requestLoggerPlugin from "./plugins/request-logger-plugin.js";
import responsePlugin from "./plugins/response-plugin.js";

const app = Fastify();

await app.register(zodPlugin);
await app.register(errorPlugin);
await app.register(requestLoggerPlugin);
await app.register(responsePlugin);

await app.register(routes, {
  prefix: "/api",
});

export default app;
