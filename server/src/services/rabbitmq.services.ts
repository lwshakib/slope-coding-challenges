import amqp from "amqplib";

const RABBITMQ_URL = process.env.RABBITMQ_URL || "amqp://guest:guest@localhost:5672";

let connection: amqp.Connection | null = null;
let channel: amqp.Channel | null = null;

export const connectRabbitMQ = async () => {
    try {
        connection = await amqp.connect(RABBITMQ_URL);
        const ch = await connection.createChannel();
        channel = ch;
        console.log("Connected to RabbitMQ");

        // Define queues
        await ch.assertQueue("javascript_queue", { durable: true });
        await ch.assertQueue("python_queue", { durable: true });
        await ch.assertQueue("cpp_queue", { durable: true });
        await ch.assertQueue("result_queue", { durable: true });

        return { connection, channel };
    } catch (error) {
        console.error("Failed to connect to RabbitMQ:", error);
        throw error;
    }
};

export const getChannel = () => {
    if (!channel) {
        throw new Error("RabbitMQ channel not initialized. Call connectRabbitMQ first.");
    }
    return channel;
};

export const sendToQueue = async (queue: string, message: any) => {
    const ch = getChannel();
    ch.sendToQueue(queue, Buffer.from(JSON.stringify(message)), { persistent: true });
};
