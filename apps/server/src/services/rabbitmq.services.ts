import { connect, type Connection, type Channel } from "amqplib"
import { RABBITMQ_URL } from "../env.js"
import logger from "../logger/winston.logger.js"

class RabbitMQService {
  private connection: any = null
  private channel: any = null
  private url: string

  constructor() {
    this.url = RABBITMQ_URL as string
    if (!this.url) {
      throw new Error("❌ RABBITMQ_URL environment variable is missing.")
    }
  }

  public async connect() {
    try {
      this.connection = await connect(this.url)
      this.channel = await this.connection.createChannel()
      logger.info("Connected to RabbitMQ")

      // Define queues
      if (this.channel) {
        await this.channel.assertQueue("javascript_queue", { durable: true })
        await this.channel.assertQueue("python_queue", { durable: true })
        await this.channel.assertQueue("cpp_queue", { durable: true })
        await this.channel.assertQueue("result_queue", { durable: true })
      }

      return { connection: this.connection, channel: this.channel }
    } catch (error) {
      logger.error(`Failed to connect to RabbitMQ: ${error}`)
      throw error
    }
  }

  public getChannel(): any {
    if (!this.channel) {
      throw new Error("RabbitMQ channel not initialized. Call connect() first.")
    }
    return this.channel
  }

  public async sendToQueue(queue: string, message: any) {
    const ch = this.getChannel()
    ch.sendToQueue(queue, Buffer.from(JSON.stringify(message)), {
      persistent: true,
    })
  }

  public async close() {
    if (this.connection) {
      await this.connection.close()
    }
  }
}

const rabbitmqService = new RabbitMQService()
export { rabbitmqService }
export default rabbitmqService
