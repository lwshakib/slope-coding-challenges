import { exec } from "child_process";
import fs from "fs";
import path from "path";
import { promisify } from "util";

const execAsync = promisify(exec);
const WORK_DIR = "/app/work";

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
            const pyFile = `${baseName}.py`;

            const wrapper = `
import json
import sys
import collections
import math
import heapq
import bisect
import re
import time
import tracemalloc
from typing import *

${code}

def run_test():
    try:
        local_vars = {}
        input_str = """${testCase.input}"""
        import re
        # Basic split for multiple assignments: "nums = [1,2], target = 3"
        parts = re.split(r',\\s*(?=[a-zA-Z_][a-zA-Z0-9_]*\\s*=)', input_str)
        for part in parts:
            exec(part.strip(), {}, local_vars)
        
        tracemalloc.start()
        start_time = time.perf_counter()
        
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
        
        end_time = time.perf_counter()
        current, peak = tracemalloc.get_traced_memory()
        tracemalloc.stop()
        
        runtime_ms = (end_time - start_time) * 1000
        memory_kb = peak / 1024
                
        print(json.dumps({
            "result": result,
            "runtime": runtime_ms,
            "memory": memory_kb
        }))
    except Exception as e:
        print(f"ERROR_MSG:{str(e)}", file=sys.stderr)

if __name__ == "__main__":
    run_test()
`;
            fs.writeFileSync(pyFile, wrapper);

            // Run
            try {
                const { stdout, stderr } = await execAsync(`python3 "${pyFile}"`, { timeout: 2000 });

                if (stderr && stderr.includes("ERROR_MSG:")) {
                    results.push({
                        caseIdx: i,
                        status: "RUNTIME_ERROR",
                        input: testCase.input,
                        expected: testCase.expectedOutput,
                        error: stderr.replace("ERROR_MSG:", "").trim()
                    });
                } else if (stderr) {
                    results.push({
                        caseIdx: i,
                        status: "RUNTIME_ERROR",
                        input: testCase.input,
                        expected: testCase.expectedOutput,
                        error: stderr.trim()
                    });
                } else {
                    const stdoutResult = stdout.trim();
                    let parsed;
                    try {
                        parsed = JSON.parse(stdoutResult);
                    } catch (e) {
                        parsed = { result: stdoutResult, runtime: 0, memory: 0 };
                    }

                    const actualResult = parsed.result;
                    const runtime = parsed.runtime || 0;
                    const memory = parsed.memory || 0;

                    const expectedParsed = JSON.parse(testCase.expectedOutput);
                    const isMatch = JSON.stringify(actualResult) === JSON.stringify(expectedParsed);

                    results.push({
                        caseIdx: i,
                        status: isMatch ? "PASSED" : "FAILED",
                        input: testCase.input,
                        expected: testCase.expectedOutput,
                        actual: JSON.stringify(actualResult),
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
                if (fs.existsSync(pyFile)) fs.unlinkSync(pyFile);
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