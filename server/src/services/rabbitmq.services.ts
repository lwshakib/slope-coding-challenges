import amqp, { type Connection, type Channel } from "amqplib";
import "dotenv/config";

class RabbitMQService {
  private connection: Connection | null = null;
  private channel: Channel | null = null;
  private url: string;

  constructor() {
    this.url = process.env.RABBITMQ_URL as string;
    if (!this.url) {
      throw new Error("❌ RABBITMQ_URL environment variable is missing.");
    }
  }

  public async connect() {
    try {
      const connection: any = await amqp.connect(this.url);
      const channel: any = await connection.createChannel();
      console.log("Connected to RabbitMQ");

      // Define queues
      await channel.assertQueue("javascript_queue", { durable: true });
      await channel.assertQueue("python_queue", { durable: true });
      await channel.assertQueue("cpp_queue", { durable: true });
      await channel.assertQueue("result_queue", { durable: true });

      this.connection = connection as Connection;
      this.channel = channel as Channel;

      return { connection: this.connection, channel: this.channel };
    } catch (error) {
      console.error("Failed to connect to RabbitMQ:", error);
      throw error;
    }
  }

  public getChannel(): Channel {
    if (!this.channel) {
      throw new Error("RabbitMQ channel not initialized. Call connect() first.");
    }
    return this.channel;
  }

  public async sendToQueue(queue: string, message: any) {
    const ch = this.getChannel();
    ch.sendToQueue(queue, Buffer.from(JSON.stringify(message)), { persistent: true });
  }

  public async close() {
    if (this.connection) {
      await (this.connection as any).close();
    }
  }
}

export const rabbitmqService = new RabbitMQService();
export default rabbitmqService;
