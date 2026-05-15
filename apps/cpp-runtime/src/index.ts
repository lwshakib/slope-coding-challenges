import { exec } from "child_process";
import fs from "fs";
import { promisify } from "util";
import amqp from "amqplib";

const execAsync = promisify(exec);
const RABBITMQ_URL = process.env.RABBITMQ_URL || "amqp://guest:guest@localhost:5672";

/**
 * Basic parser for LeetCode-style input strings
 */
function parseInputToCpp(input: string): string {
    let cppInput = input.replace(/\[/g, "{").replace(/\]/g, "}");
    const parts: string[] = [];
    let current = "";
    let braceCount = 0;
    for (let i = 0; i < cppInput.length; i++) {
        if (cppInput[i] === "{") braceCount++;
        if (cppInput[i] === "}") braceCount--;
        if (cppInput[i] === "," && braceCount === 0) {
            parts.push(current.trim());
            current = "";
        } else {
            current += cppInput[i];
        }
    }
    parts.push(current.trim());
    
    let declarations = "";
    for (const part of parts) {
        const [name, val] = part.split("=").map(s => s.trim());
        if (!name || !val) continue;
        if (val.startsWith("{")) {
            declarations += `    std::vector<int> ${name} = ${val};\n`;
        } else if (val.startsWith('"')) {
            declarations += `    std::string ${name} = ${val};\n`;
        } else {
            declarations += `    auto ${name} = ${val};\n`;
        }
    }
    return declarations;
}

async function runSingleCase(code: string, testCase: any, functionName: string, i: number) {
    const baseName = `/tmp/run_${Date.now()}_${i}`;
    const cppFile = `${baseName}.cpp`;
    const exeFile = `${baseName}.out`;

    try {
        const inputDecls = parseInputToCpp(testCase.input);
        
        const varNames: string[] = [];
        let currentVar = "";
        let depth = 0;
        for (let j = 0; j < testCase.input.length; j++) {
            if (testCase.input[j] === "[" || testCase.input[j] === "{") depth++;
            if (testCase.input[j] === "]" || testCase.input[j] === "}") depth--;
            if (testCase.input[j] === "," && depth === 0) {
                varNames.push(currentVar.split("=")[0]!.trim());
                currentVar = "";
            } else {
                currentVar += testCase.input[j];
            }
        }
        if (currentVar) varNames.push(currentVar.split("=")[0]!.trim());
        const callArgs = varNames.join(", ");

        const wrapper = `
#include <iostream>
#include <vector>
#include <string>
#include <algorithm>
#include <unordered_map>
#include <map>
#include <set>
#include <queue>
#include <stack>
#include <type_traits>
#include <chrono>
#include <sys/resource.h>

using namespace std;

template<typename T>
void printResult(const T& res) {
    if constexpr (is_same_v<T, bool>) {
        cout << (res ? "true" : "false") << endl;
    } else if constexpr (is_integral_v<T> || is_floating_point_v<T>) {
        cout << res << endl;
    } else if constexpr (is_same_v<T, string>) {
        cout << "\\"\" << res << "\\"\" << endl;
    } else {
        cout << "[";
        for (size_t i = 0; i < res.size(); ++i) {
            if constexpr (is_same_v<typename T::value_type, string>) {
                cout << "\\"\" << res[i] << "\\"\" << endl;
            } else {
                cout << res[i];
            }
            if (i < res.size() - 1) cout << ",";
        }
        cout << "]" << endl;
    }
}

${code}

int main() {
    try {
        Solution sol;
${inputDecls}
        auto start = std::chrono::high_resolution_clock::now();
        auto res = sol.${functionName}(${callArgs});
        auto end = std::chrono::high_resolution_clock::now();
        
        std::chrono::duration<double, std::milli> elapsed = end - start;
        
        struct rusage usage;
        getrusage(RUSAGE_SELF, &usage);
        
        cout << "---METRICS_START---" << endl;
        cout << elapsed.count() << endl;
        cout << usage.ru_maxrss << endl;
        cout << "---METRICS_END---" << endl;
        
        printResult(res);
    } catch (...) {
        return 1;
    }
    return 0;
}
`;
        fs.writeFileSync(cppFile, wrapper);

        // Compile
        try {
            await execAsync(`g++ -std=c++17 "${cppFile}" -o "${exeFile}"`);
        } catch (error: any) {
            return {
                status: "COMPILE_ERROR",
                error: (error.stderr || error.message)?.toString()
            };
        }

        // Run
        try {
            const { stdout, stderr } = await execAsync(`"${exeFile}"`, { timeout: 2000 });

            if (stderr) {
                return {
                    status: "RUNTIME_ERROR",
                    error: stderr.toString()
                };
            } else {
                const stdoutContent = stdout.toString();
                const metricsMatch = stdoutContent.match(/---METRICS_START---\n([\d.]+)\n(\d+)\n---METRICS_END---/);
                
                let runtime = 0;
                let memory = 0;
                let cleanStdout = stdoutContent;

                if (metricsMatch) {
                    runtime = parseFloat(metricsMatch[1]!);
                    memory = parseFloat(metricsMatch[2]!);
                    cleanStdout = stdoutContent.replace(/---METRICS_START---[\s\S]*?---METRICS_END---\n/, "").trim();
                }

                return {
                    status: "SUCCESS",
                    actual: cleanStdout,
                    runtime,
                    memory
                };
            }
        } catch (error: any) {
            return {
                status: error.killed ? "TLE" : "RUNTIME_ERROR",
                error: (error.stderr || error.message)?.toString()
            };
        }
    } finally {
        if (fs.existsSync(cppFile)) fs.unlinkSync(cppFile);
        if (fs.existsSync(exeFile)) fs.unlinkSync(exeFile);
    }
}

async function startWorker() {
    try {
        console.log("Connecting to RabbitMQ...");
        const connection = await amqp.connect(RABBITMQ_URL);
        const channel = await connection.createChannel();
        const queue = "cpp_queue";

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
                if (result.status === "SUCCESS") {
                    const expected = testCase.expectedOutput.replace(/\s/g, "");
                    const actual = (result as any).actual.replace(/\s/g, "");
                    finalStatus = (actual === expected) ? "PASSED" : "FAILED";
                }

                const response = {
                    submissionId,
                    caseIdx,
                    totalCases,
                    isTest,
                    status: finalStatus,
                    actual: ("actual" in result ? result.actual : "") || "",
                    error: ("error" in result ? result.error : null) || null,
                    runtime: ("runtime" in result ? result.runtime : 0) || 0,
                    memory: ("memory" in result ? result.memory : 0) || 0,
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