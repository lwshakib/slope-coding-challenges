import amqp from "amqplib";
import { exec } from "child_process";
import fs from "fs";
import path from "path";
import { promisify } from "util";

const execAsync = promisify(exec);

const RABBITMQ_URL = process.env.RABBITMQ_URL || "amqp://guest:guest@localhost:5672";
const QUEUE = "cpp_queue";
const RESULT_QUEUE = "result_queue";

/**
 * Basic parser for LeetCode-style input strings like "nums = [2,7,11,15], target = 9"
 * It converts them into a format that can be easily injected into C++ code.
 */
function parseInputToCpp(input: string): string {
    // This is a simple parser. It looks for variable assignments.
    // e.g. "nums1 = [1,3], nums2 = [2]" -> ["nums1", "[1,3]", "nums2", "[2]"]
    
    // Replace brackets with curly braces for C++ vector initialization
    let cppInput = input.replace(/\[/g, "{").replace(/\]/g, "}");
    
    // Convert assignments like "nums = {1,2,3}" to "auto nums = std::vector<int>{1,2,3}"
    // This is hard to do perfectly without knowing types, so we'll rely on a simpler approach:
    // We'll just define the variables as they appear.
    
    // For Two Sum specifically: "nums = {2,7,11,15}, target = 9"
    // We want to generate:
    // std::vector<int> nums = {2, 7, 11, 15};
    // int target = 9;
    
    // Let's try to split by comma, but be careful of commas inside braces
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
            // Assume it's a vector of ints for now. 
            // In a production system, we'd get the types from the metadata.
            declarations += `    std::vector<int> ${name} = ${val};\n`;
        } else if (val.startsWith('"')) {
            // Assume it's a string
            declarations += `    std::string ${name} = ${val};\n`;
        } else {
            // Assume it's an int or bool
            declarations += `    auto ${name} = ${val};\n`;
        }
    }
    
    return declarations;
}

async function runCode(code: string, testCase: any, caseIdx: number, totalCases: number, slug: string, functionName: string) {
    const baseName = `temp_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const cppFile = path.resolve(__dirname, `${baseName}.cpp`);
    const exeFile = path.resolve(__dirname, `${baseName}.out`);

    const inputDecls = parseInputToCpp(testCase.input);
    
    // Split input by comma but respect brackets/braces to extract variable names
    const varNames: string[] = [];
    let currentVar = "";
    let depth = 0;
    for (let i = 0; i < testCase.input.length; i++) {
        if (testCase.input[i] === "[" || testCase.input[i] === "{") depth++;
        if (testCase.input[i] === "]" || testCase.input[i] === "}") depth--;
        if (testCase.input[i] === "," && depth === 0) {
            varNames.push(currentVar.split("=")[0]!.trim());
            currentVar = "";
        } else {
            currentVar += testCase.input[i];
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
        cout << "\"" << res << "\"" << endl;
    } else {
        // Assume vector or similar container
        cout << "[";
        for (size_t i = 0; i < res.size(); ++i) {
            if constexpr (is_same_v<typename T::value_type, string>) {
                cout << "\"" << res[i] << "\"";
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

    let result: any;

    try {
        // Compile with C++17 support
        try {
            await execAsync(`g++ -std=c++17 "${cppFile}" -o "${exeFile}"`);
        } catch (error: any) {
            return {
                caseIdx,
                totalCases,
                status: "COMPILE_ERROR",
                input: testCase?.input || "",
                expected: testCase?.expectedOutput || "",
                error: (error.stderr || error.message)?.toString()
            };
        }

        // Run
        try {
            const startTime = Date.now();
            const { stdout, stderr } = await execAsync(`"${exeFile}"`, { timeout: 2000 });
            const runtime = Date.now() - startTime;

            if (stderr) {
                result = {
                    caseIdx,
                    totalCases,
                    status: "RUNTIME_ERROR",
                    input: testCase?.input || "",
                    expected: testCase?.expectedOutput || "",
                    error: stderr?.toString()
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

                const expected = testCase.expectedOutput.replace(/\s/g, "");
                const actual = cleanStdout.replace(/\s/g, "");
                
                if (actual !== expected) {
                    result = {
                        caseIdx,
                        totalCases,
                        status: "FAILED",
                        input: testCase?.input || "",
                        expected: testCase?.expectedOutput || "",
                        actual: cleanStdout,
                        runtime,
                        memory
                    };
                } else {
                    result = {
                        caseIdx,
                        totalCases,
                        status: "PASSED",
                        input: testCase?.input || "",
                        expected: testCase?.expectedOutput || "",
                        actual: cleanStdout,
                        runtime,
                        memory
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
                    error: (error.stderr || error.message)?.toString()
                };
            }
        }
    } catch (error: any) {
        result = {
            caseIdx,
            totalCases,
            status: "SYSTEM_ERROR",
            input: testCase?.input || "",
            expected: testCase?.expectedOutput || "",
            error: error.message?.toString()
        };
    } finally {
        if (fs.existsSync(cppFile)) fs.unlinkSync(cppFile);
        if (fs.existsSync(exeFile)) fs.unlinkSync(exeFile);
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
                    const { submissionId, code, testCase, caseIdx, totalCases, slug, functionName, isTest } = data;
                    
                    if (!testCase) {
                        console.error(`Invalid message received: missing testCase. Submission: ${submissionId}`);
                        channel.ack(msg);
                        return;
                    }

                    console.log(`Processing ${isTest ? 'test run' : 'submission'} ${submissionId} - Case ${(caseIdx ?? 0) + 1}/${totalCases}`);

                    const result = await runCode(code, testCase, caseIdx, totalCases, slug, functionName);

                    channel.sendToQueue(RESULT_QUEUE, Buffer.from(JSON.stringify({
                        submissionId,
                        isTest,
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