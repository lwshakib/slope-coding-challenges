import httpServer from "./app";

import "dotenv/config";
import logger from "./logger/winston.logger";
import rabbitmqService from "./services/rabbitmq.services";
import { startResultConsumer } from "./features/problems/problems.worker";

async function startServer() {
  await rabbitmqService.connect();
  startResultConsumer();
  
  const port = process.env.PORT || 4000;
  httpServer.listen(port, () => {
    logger.info(`Server is running on http://localhost:${port}`);
  });
}
startServer();
