import { exec } from "child_process";
import fs from "fs";
import path from "path";
import { promisify } from "util";

const execAsync = promisify(exec);
const WORK_DIR = "/app/work";

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

async function runCode() {
    try {
        // 1. Read files from the mounted volume
        const code = fs.readFileSync(path.join(WORK_DIR, "code.txt"), "utf8");
        const testCases = JSON.parse(fs.readFileSync(path.join(WORK_DIR, "testCases.json"), "utf8"));
        const metadata = JSON.parse(fs.readFileSync(path.join(WORK_DIR, "metadata.json"), "utf8"));
        const { functionName } = metadata;

        const results = [];

        for (let i = 0; i < testCases.length; i++) {
            const testCase = testCases[i];
            const baseName = `/tmp/run_${Date.now()}_${i}`;
            const cppFile = `${baseName}.cpp`;
            const exeFile = `${baseName}.out`;

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
        cout << "\\"" << res << "\\"" << endl;
    } else {
        cout << "[";
        for (size_t i = 0; i < res.size(); ++i) {
            if constexpr (is_same_v<typename T::value_type, string>) {
                cout << "\\"" << res[i] << "\\"";
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
                results.push({
                    caseIdx: i,
                    status: "COMPILE_ERROR",
                    input: testCase.input,
                    expected: testCase.expectedOutput,
                    error: (error.stderr || error.message)?.toString()
                });
                if (fs.existsSync(cppFile)) fs.unlinkSync(cppFile);
                continue;
            }

            // Run
            try {
                const { stdout, stderr } = await execAsync(`"${exeFile}"`, { timeout: 2000 });

                if (stderr) {
                    results.push({
                        caseIdx: i,
                        status: "RUNTIME_ERROR",
                        input: testCase.input,
                        expected: testCase.expectedOutput,
                        error: stderr.toString()
                    });
                } else {
                    const stdoutContent = stdout.toString();
                    const metricsMatch = stdoutContent.match(/---METRICS_START---\\n([\\d.]+)\\n(\\d+)\\n---METRICS_END---/);
                    
                    let runtime = 0;
                    let memory = 0;
                    let cleanStdout = stdoutContent;

                    if (metricsMatch) {
                        runtime = parseFloat(metricsMatch[1]!);
                        memory = parseFloat(metricsMatch[2]!);
                        cleanStdout = stdoutContent.replace(/---METRICS_START---[\\s\\S]*?---METRICS_END---\\n/, "").trim();
                    }

                    const expected = testCase.expectedOutput.replace(/\\s/g, "");
                    const actual = cleanStdout.replace(/\\s/g, "");
                    
                    results.push({
                        caseIdx: i,
                        status: (actual === expected) ? "PASSED" : "FAILED",
                        input: testCase.input,
                        expected: testCase.expectedOutput,
                        actual: cleanStdout,
                        runtime,
                        memory
                    });
                }
            } catch (error: any) {
                results.push({
                    caseIdx: i,
                    status: error.killed ? "TLE" : "RUNTIME_ERROR",
                    input: testCase.input,
                    expected: testCase.expectedOutput,
                    error: (error.stderr || error.message)?.toString()
                });
            } finally {
                if (fs.existsSync(cppFile)) fs.unlinkSync(cppFile);
                if (fs.existsSync(exeFile)) fs.unlinkSync(exeFile);
            }
        }

        console.log(JSON.stringify(results));

    } catch (error: any) {
        console.log(JSON.stringify([{
            status: "SYSTEM_ERROR",
            error: error.message
        }]));
    }
}

runCode();