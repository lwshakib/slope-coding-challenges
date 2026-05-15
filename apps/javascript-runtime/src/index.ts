import vm from "node:vm";
import fs from "node:fs";
import amqp from "amqplib";

const RABBITMQ_URL = process.env.RABBITMQ_URL || "amqp://guest:guest@localhost:5672";

/**
 * Basic parser for input strings like "nums = [2,7,11,15], target = 9"
 */
function parseInputToJs(input: string): Record<string, any> {
    const vars: Record<string, any> = {};
    const parts: string[] = [];
    let current = "";
    let bracketCount = 0;
    for (let i = 0; i < input.length; i++) {
        if (input[i] === "[" || input[i] === "{") bracketCount++;
        if (input[i] === "]" || input[i] === "}") bracketCount--;
        if (input[i] === "," && bracketCount === 0) {
            parts.push(current.trim());
            current = "";
        } else {
            current += input[i];
        }
    }
    parts.push(current.trim());

    for (const part of parts) {
        const [name, val] = part.split("=").map(s => s.trim());
        if (name && val) {
            try {
                vars[name] = JSON.parse(val.replace(/'/g, '"'));
            } catch (e) {
                vars[name] = val;
            }
        }
    }
    return vars;
}

async function runSingleCase(code: string, testCase: any, functionName: string, i: number) {
    try {
        const inputVars = parseInputToJs(testCase.input);
        const argValues = Object.values(inputVars);

        const sandbox = {
            console,
            process: { env: {} }
        };
        const context = vm.createContext(sandbox);

        const wrapperScript = `
${code}

(function() {
    let fn = null;
    
    if (typeof Solution === 'function') {
        const sol = new Solution();
        if (typeof sol['${functionName}'] === 'function') {
            fn = sol['${functionName}'].bind(sol);
        } else {
            const methods = Object.getOwnPropertyNames(Solution.prototype)
                .filter(m => m !== 'constructor' && typeof sol[m] === 'function');
            if (methods.length > 0) {
                fn = sol[methods[0]].bind(sol);
            }
        }
    }

    if (!fn && typeof ${functionName} === 'function') {
        fn = ${functionName};
    } else if (!fn) {
        if (typeof solve === 'function') fn = solve;
    }

    if (!fn) throw new Error("No function or class method '${functionName}' found");
    
    return fn(...${JSON.stringify(argValues)});
})()`;

        const startMemory = process.memoryUsage().heapUsed;
        const startTime = performance.now();
        
        let vmResult;
        try {
            vmResult = vm.runInContext(wrapperScript, context, { timeout: 2000 });
        } catch (e: any) {
            return {
                status: "RUNTIME_ERROR",
                error: e.message
            };
        }

        const runtime = performance.now() - startTime;
        const endMemory = process.memoryUsage().heapUsed;
        const memory = Math.max(0, (endMemory - startMemory) / 1024); // KB
        
        return {
            status: "SUCCESS",
            actualResult: vmResult,
            runtime,
            memory
        };
    } catch (error: any) {
        return {
            status: "SYSTEM_ERROR",
            error: error.message
        };
    }
}

async function startWorker() {
    try {
        console.log("Connecting to RabbitMQ...");
        const connection = await amqp.connect(RABBITMQ_URL);
        const channel = await connection.createChannel();
        const queue = "javascript_queue";

        await channel.assertQueue(queue, { durable: true });
        console.log(`[*] Waiting for messages in ${queue}.`);

        channel.consume(queue, async (msg) => {
            if (msg !== null) {
                const content = JSON.parse(msg.content.toString());
                const { submissionId, code, functionName, testCase, caseIdx, totalCases, isTest } = content;

                console.log(`[x] Received task for submission ${submissionId}, case ${caseIdx}`);

                const result = await runSingleCase(code, testCase, functionName, caseIdx);

                // Check against expected output
                let finalStatus = result.status;
                let actualStr = "";
                if (result.status === "SUCCESS") {
                    actualStr = JSON.stringify(result.actualResult);
                    const expectedParsed = JSON.parse(testCase.expectedOutput);
                    const isMatch = JSON.stringify(result.actualResult) === JSON.stringify(expectedParsed);
                    finalStatus = isMatch ? "PASSED" : "FAILED";
                }

                const response = {
                    submissionId,
                    caseIdx,
                    totalCases,
                    isTest,
                    status: finalStatus,
                    actual: actualStr || ("actualResult" in result ? String(result.actualResult) : ""),
                    error: ("error" in result ? result.error : null),
                    runtime: ("runtime" in result ? result.runtime : 0),
                    memory: ("memory" in result ? result.memory : 0),
                    input: testCase.input,
                    expected: testCase.expectedOutput
                };

                await channel.assertQueue("result_queue", { durable: true });
                channel.sendToQueue("result_queue", Buffer.from(JSON.stringify(response)), { persistent: true });

                console.log(`[x] Finished task for submission ${submissionId}, case ${caseIdx}`);
                channel.ack(msg);
            }
        });
    } catch (error) {
        console.error("Failed to start worker:", error);
        process.exit(1);
    }
}

startWorker();