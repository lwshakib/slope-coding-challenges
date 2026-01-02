import amqp from "amqplib";
import vm from "node:vm";

const RABBITMQ_URL = process.env.RABBITMQ_URL || "amqp://guest:guest@localhost:5672";
const QUEUE = "javascript_queue";
const RESULT_QUEUE = "result_queue";

/**
 * Basic parser for input strings like "nums = [2,7,11,15], target = 9"
 */
function parseInputToJs(input: string): Record<string, any> {
    const vars: Record<string, any> = {};
    // Split by comma but respect brackets
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
                // Use Eval-like logic Safely or just JSON parse if it's a simple type
                // Since this is for internal use, we can be a bit more flexible
                vars[name] = JSON.parse(val.replace(/'/g, '"'));
            } catch (e) {
                // Fallback for non-JSON values
                vars[name] = val;
            }
        }
    }
    return vars;
}

async function runCode(code: string, testCase: any, caseIdx: number, totalCases: number, functionName: string) {
    let result: any;
    try {
        const inputVars = parseInputToJs(testCase.input);
        const argValues = Object.values(inputVars);

        const sandbox = {
            console,
            process: {
                env: {}
            }
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

        const startTime = Date.now();
        const vmResult = vm.runInContext(wrapperScript, context, { timeout: 1000 });
        const runtime = Date.now() - startTime;
        
        const expectedParsed = JSON.parse(testCase.expectedOutput);
        const isMatch = JSON.stringify(vmResult) === JSON.stringify(expectedParsed);
        
        if (!isMatch) {
            result = {
                caseIdx,
                totalCases,
                status: "FAILED",
                input: testCase.input,
                expected: testCase.expectedOutput,
                actual: JSON.stringify(vmResult),
                runtime
            };
        } else {
            result = {
                caseIdx,
                totalCases,
                status: "PASSED",
                input: testCase.input,
                expected: testCase.expectedOutput,
                actual: JSON.stringify(vmResult),
                runtime
            };
        }
    } catch (error: any) {
        result = {
            caseIdx,
            totalCases,
            status: "RUNTIME_ERROR",
            input: testCase?.input || "",
            expected: testCase?.expectedOutput || "",
            error: error.message
        };
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
                    channel.ack(msg); // Ack to prevent infinite loop for malformed JSON
                }
            }
        });
    } catch (error) {
        console.error("Worker failed:", error);
        process.exit(1);
    }
}

startWorker();