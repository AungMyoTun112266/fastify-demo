import app from "./app.js";
import { logger } from "./shared/logger/index.js";

const start = async (): Promise<void> => {
  try {
    await app.listen({
      port: 3000,
      host: "0.0.0.0",
    });
    logger.info("Server is running on http://localhost:3000");
  } catch (error) {
    logger.error(error);
    process.exit(1);
  }
};

void start();
