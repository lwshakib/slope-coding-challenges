import httpServer from "./app";

import "dotenv/config";
import logger from "./logger/winston.logger";
import { connectRabbitMQ } from "./services/rabbitmq.services";
import { startResultConsumer } from "./features/problems/problems.worker";
import { syncContestsToDB } from "./features/contests/contests.registry";

async function startServer() {
  await connectRabbitMQ();
  startResultConsumer();
  await syncContestsToDB();
  
  const port = process.env.PORT || 4000;
  httpServer.listen(port, () => {
    logger.info(`Server is running on http://localhost:${port}`);
  });
}
startServer();
