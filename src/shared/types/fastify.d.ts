import "fastify";

declare module "fastify" {
  interface FastifyRequest {
    requestContext?: unknown;
  }
}
