import httpServer from "./app.js"
import { PORT } from "./env.js"
import logger from "./logger/winston.logger.js"
import rabbitmqService from "./services/rabbitmq.services.js"
import { setupPostgres } from "./scripts/postgres-setup.js"
import { startResultConsumer } from "./problems/problems.worker.js"

async function startServer() {
  try {
    await setupPostgres()
    await rabbitmqService.connect()
    await startResultConsumer()

    const port = PORT || 8000
    httpServer.listen(port, () => {
      logger.info(`Server is running on http://localhost:${port}`)
    })
  } catch (error) {
    logger.error(`Failed to start server: ${error}`)
    process.exit(1)
  }
}

startServer()
