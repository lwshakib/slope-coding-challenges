import amqp from "amqplib";
import { exec } from "child_process";
import fs from "fs";
import path from "path";
import { promisify } from "util";
import { v4 as uuidv4 } from "uuid";

const execAsync = promisify(exec);

const RABBITMQ_URL = process.env.RABBITMQ_URL || "amqp://guest:guest@localhost:5672";
const JS_QUEUE = "javascript_queue";
const CPP_QUEUE = "cpp_queue";
const PY_QUEUE = "python_queue";
const RESULT_QUEUE = "result_queue";

const TMP_BASE_DIR = path.resolve("d:/slope-coding-challenges/tmp");

if (!fs.existsSync(TMP_BASE_DIR)) {
    fs.mkdirSync(TMP_BASE_DIR, { recursive: true });
}

async function handleSubmission(msg: amqp.ConsumeMessage | null, channel: amqp.Channel, language: string) {
    if (!msg) return;

    let submissionId = "unknown";
    let runDir = "";

    try {
        const data = JSON.parse(msg.content.toString());
        submissionId = data.submissionId || uuidv4();
        const { code, testCase, testCases, functionName, isTest } = data;
        
        // Normalize singular or plural test cases into an array
        const normalizedTestCases = testCases || (testCase ? [testCase] : []);
        
        console.log(`[${language.toUpperCase()}] Processing ${isTest ? 'test run' : 'submission'} ${submissionId} (${normalizedTestCases.length} cases)`);

        // 1. Create a unique temporary directory for this run
        const runId = uuidv4();
        runDir = path.join(TMP_BASE_DIR, runId);
        fs.mkdirSync(runDir, { recursive: true });

        // 2. Write code and test case to the temp dir
        fs.writeFileSync(path.join(runDir, "code.txt"), code);
        fs.writeFileSync(path.join(runDir, "testCases.json"), JSON.stringify(normalizedTestCases));
        fs.writeFileSync(path.join(runDir, "metadata.json"), JSON.stringify({
            submissionId,
            functionName,
            language,
            isTest
        }));

        // 3. Launch the isolated Docker container
        const imageName = `slope-runtime-${language}`;
        // On Windows, Docker needs proper path formatting for volumes
        const hostPath = runDir.replace(/\\/g, '/');
        
        // docker run --rm --network none --memory="256m" --cpus="0.5" -v <host>:/app/work <image>
        const dockerCmd = `docker run --rm --network none --memory="256m" --cpus="0.5" -v "${hostPath}:/app/work" ${imageName}`;
        
        const { stdout, stderr } = await execAsync(dockerCmd, { timeout: 10000 }); // 10s total limit

        if (stderr && !stdout) {
             throw new Error(stderr);
        }

        // 4. Parse the output (Container should print JSON array to stdout)
        let results;
        try {
            results = JSON.parse(stdout.trim());
            if (!Array.isArray(results)) {
                results = [results]; // Fallback if single result returned
            }
        } catch (e) {
            results = [{
                status: "SYSTEM_ERROR",
                error: `Failed to parse container output as JSON: ${stdout}\n${stderr}`
            }];
        }

        // 5. Send results to the result queue (Send as an array)
        channel.sendToQueue(RESULT_QUEUE, Buffer.from(JSON.stringify({
            submissionId,
            isTest,
            results
        })), { persistent: true });

        console.log(`[${language.toUpperCase()}] Done processing ${submissionId}`);
        channel.ack(msg);

    } catch (error: any) {
        console.error(`[${language.toUpperCase()}] Error processing ${submissionId}:`, error);
        
        // Send failure result
        channel.sendToQueue(RESULT_QUEUE, Buffer.from(JSON.stringify({
            submissionId,
            status: "SYSTEM_ERROR",
            error: error.message
        })), { persistent: true });

        channel.ack(msg);
    } finally {
        // 6. Cleanup the temp directory on the host
        if (runDir && fs.existsSync(runDir)) {
            try {
                fs.rmSync(runDir, { recursive: true, force: true });
            } catch (e) {
                console.warn(`Failed to cleanup directory ${runDir}:`, e);
            }
        }
    }
}

async function startWorker() {
    try {
        const connection = await amqp.connect(RABBITMQ_URL);
        const channel = await connection.createChannel();

        await channel.assertQueue(JS_QUEUE, { durable: true });
        await channel.assertQueue(CPP_QUEUE, { durable: true });
        await channel.assertQueue(PY_QUEUE, { durable: true });
        await channel.assertQueue(RESULT_QUEUE, { durable: true });

        channel.prefetch(2); // Process 2 at a time

        console.log(`Orchestrator Worker listening on ${JS_QUEUE}, ${CPP_QUEUE}, ${PY_QUEUE}`);

        channel.consume(JS_QUEUE, (msg) => handleSubmission(msg, channel, "js"));
        channel.consume(CPP_QUEUE, (msg) => handleSubmission(msg, channel, "cpp"));
        channel.consume(PY_QUEUE, (msg) => handleSubmission(msg, channel, "python"));

    } catch (error) {
        console.error("Orchestrator Worker failed to start:", error);
        process.exit(1);
    }
}

startWorker();