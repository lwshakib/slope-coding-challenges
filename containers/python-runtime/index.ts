import amqp from "amqplib";
import { exec } from "child_process";
import fs from "fs";
import path from "path";
import { promisify } from "util";

const execAsync = promisify(exec);

const RABBITMQ_URL = process.env.RABBITMQ_URL || "amqp://guest:guest@localhost:5672";
const QUEUE = "python_queue";
const RESULT_QUEUE = "result_queue";

async function runCode(code: string, testCase: any, caseIdx: number, totalCases: number, functionName: string) {
    const baseName = `temp_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const tempFile = path.resolve(__dirname, `${baseName}.py`);
    
    const wrapper = `
import json
import sys
import collections
import math
import heapq
import bisect
import re
from typing import *

${code}

def run_test():
    try:
        local_vars = {}
        input_str = """${testCase.input}"""
        import re
        parts = re.split(r',\\s*(?=[a-zA-Z_][a-zA-Z0-9_]*\\s*=)', input_str)
        for part in parts:
            exec(part.strip(), {}, local_vars)
        
        if 'Solution' in globals() and isinstance(globals()['Solution'], type):
            sol = Solution()
            method = getattr(sol, '${functionName}', None)
            if method:
                result = method(**local_vars)
            else:
                methods = [m for m in dir(sol) if not m.startswith('_') and callable(getattr(sol, m))]
                if methods:
                    result = getattr(sol, methods[0])(**local_vars)
                else:
                    raise Exception(f"No method '${functionName}' found in Solution class")
        elif '${functionName}' in globals():
            result = globals()['${functionName}'](**local_vars)
        else:
            raise Exception(f"No function or class method '${functionName}' found")
                
        print(json.dumps(result))
    except Exception as e:
        print(f"ERROR_MSG:{str(e)}", file=sys.stderr)

if __name__ == "__main__":
    run_test()
`;
    fs.writeFileSync(tempFile, wrapper);

    let result: any;

    try {
        const startTime = Date.now();
        const { stdout, stderr } = await execAsync(`python3 "${tempFile}"`, { timeout: 2000 });
        const runtime = Date.now() - startTime;

        if (stderr && stderr.includes("ERROR_MSG:")) {
            result = {
                caseIdx,
                totalCases,
                status: "RUNTIME_ERROR",
                input: testCase.input,
                expected: testCase.expectedOutput,
                error: stderr.replace("ERROR_MSG:", "").trim(),
                runtime
            };
        } else if (stderr) {
            result = {
                caseIdx,
                totalCases,
                status: "RUNTIME_ERROR",
                input: testCase.input,
                expected: testCase.expectedOutput,
                error: stderr.trim(),
                runtime
            };
        } else {
            const stdoutResult = stdout.trim();
            let parsedResult;
            try {
                parsedResult = JSON.parse(stdoutResult);
            } catch (e) {
                parsedResult = stdoutResult;
            }

            const expectedParsed = JSON.parse(testCase.expectedOutput);
            const isMatch = JSON.stringify(parsedResult) === JSON.stringify(expectedParsed);

            if (!isMatch) {
                result = {
                    caseIdx,
                    totalCases,
                    status: "FAILED",
                    input: testCase.input,
                    expected: testCase.expectedOutput,
                    actual: stdoutResult,
                    runtime
                };
            } else {
                result = {
                    caseIdx,
                    totalCases,
                    status: "PASSED",
                    input: testCase.input,
                    expected: testCase.expectedOutput,
                    actual: stdoutResult,
                    runtime
                };
            }
        }
    } catch (error: any) {
        if (error.killed) {
            result = {
                caseIdx,
                totalCases,
                status: "TLE",
                input: testCase?.input || "",
                expected: testCase?.expectedOutput || "",
                error: "Time Limit Exceeded"
            };
        } else {
            result = {
                caseIdx,
                totalCases,
                status: "RUNTIME_ERROR",
                input: testCase?.input || "",
                expected: testCase?.expectedOutput || "",
                error: error.stderr || error.message
            };
        }
    } finally {
        if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
    }

    return result;
}

async function startWorker() {
    try {
        const connection = await amqp.connect(RABBITMQ_URL);
        const channel = await connection.createChannel();

        await channel.assertQueue(QUEUE, { durable: true });
        await channel.assertQueue(RESULT_QUEUE, { durable: true });

        console.log(`Worker listening on ${QUEUE}`);

        channel.consume(QUEUE, async (msg) => {
            if (msg !== null) {
                try {
                    const data = JSON.parse(msg.content.toString());
                    const { submissionId, code, testCase, caseIdx, totalCases, functionName } = data;
                    
                    if (!testCase) {
                        console.error(`Invalid message received: missing testCase. Submission: ${submissionId}`);
                        channel.ack(msg);
                        return;
                    }

                    console.log(`Processing submission ${submissionId} - Case ${(caseIdx ?? 0) + 1}/${totalCases}`);

                    const result = await runCode(code, testCase, caseIdx, totalCases, functionName);

                    channel.sendToQueue(RESULT_QUEUE, Buffer.from(JSON.stringify({
                        submissionId,
                        ...result
                    })), { persistent: true });

                    channel.ack(msg);
                    console.log(`Done processing ${submissionId} - Case ${(caseIdx ?? 0) + 1}`);
                } catch (err) {
                    console.error("Error processing message:", err);
                    channel.ack(msg);
                }
            }
        });
    } catch (error) {
        console.error("Worker failed:", error);
        process.exit(1);
    }
}

startWorker();