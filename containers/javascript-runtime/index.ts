import vm from "node:vm";
import fs from "node:fs";
import path from "node:path";

const WORK_DIR = "/app/work";

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
                results.push({
                    caseIdx: i,
                    status: "RUNTIME_ERROR",
                    error: e.message,
                    input: testCase.input,
                    expected: testCase.expectedOutput
                });
                continue;
            }

            const runtime = performance.now() - startTime;
            const endMemory = process.memoryUsage().heapUsed;
            const memory = Math.max(0, (endMemory - startMemory) / 1024); // KB
            
            const expectedParsed = JSON.parse(testCase.expectedOutput);
            const isMatch = JSON.stringify(vmResult) === JSON.stringify(expectedParsed);
            
            results.push({
                caseIdx: i,
                status: isMatch ? "PASSED" : "FAILED",
                input: testCase.input,
                expected: testCase.expectedOutput,
                actual: JSON.stringify(vmResult),
                runtime,
                memory
            });
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