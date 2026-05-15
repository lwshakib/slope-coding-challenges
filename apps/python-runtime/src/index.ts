import { exec } from "child_process"
import fs from "fs"
import { promisify } from "util"
import amqp from "amqplib"

const execAsync = promisify(exec)
const RABBITMQ_URL =
  process.env.RABBITMQ_URL || "amqp://guest:guest@localhost:5672"

async function runSingleCase(
  code: string,
  testCase: any,
  functionName: string,
  i: number
) {
  const baseName = `/tmp/run_${Date.now()}_${i}`
  const pyFile = `${baseName}.py`

  try {
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
`
    fs.writeFileSync(pyFile, wrapper)

    // Run
    try {
      const { stdout, stderr } = await execAsync(`python3 "${pyFile}"`, {
        timeout: 2000,
      })

      if (stderr && stderr.includes("ERROR_MSG:")) {
        return {
          status: "RUNTIME_ERROR",
          error: stderr.replace("ERROR_MSG:", "").trim(),
        }
      } else if (stderr) {
        return {
          status: "RUNTIME_ERROR",
          error: stderr.trim(),
        }
      } else {
        const stdoutResult = stdout.trim()
        let parsed
        try {
          parsed = JSON.parse(stdoutResult)
        } catch (e) {
          parsed = { result: stdoutResult, runtime: 0, memory: 0 }
        }

        return {
          status: "SUCCESS",
          actualResult: parsed.result,
          runtime: parsed.runtime || 0,
          memory: parsed.memory || 0,
        }
      }
    } catch (error: any) {
      return {
        status: error.killed ? "TLE" : "RUNTIME_ERROR",
        error: (error.stderr || error.message)?.toString(),
      }
    }
  } finally {
    if (fs.existsSync(pyFile)) fs.unlinkSync(pyFile)
  }
}

async function startWorker() {
  try {
    console.log("Connecting to RabbitMQ...")
    const connection = await amqp.connect(RABBITMQ_URL)
    const channel = await connection.createChannel()
    const queue = "python_queue"

    await channel.assertQueue(queue, { durable: true })
    console.log(`[*] Waiting for messages in ${queue}.`)

    channel.consume(queue, async (msg) => {
      if (msg !== null) {
        const content = JSON.parse(msg.content.toString())
        const {
          submissionId,
          code,
          functionName,
          testCase,
          caseIdx,
          totalCases,
          isTest,
        } = content

        console.log(
          `[x] Received task for submission ${submissionId}, case ${caseIdx}`
        )

        const result = await runSingleCase(
          code,
          testCase,
          functionName,
          caseIdx
        )

        // Check against expected output
        let finalStatus = result.status
        let actualStr = ""
        if (result.status === "SUCCESS") {
          actualStr = JSON.stringify(result.actualResult)
          const expectedParsed = JSON.parse(testCase.expectedOutput)
          const isMatch =
            JSON.stringify(result.actualResult) ===
            JSON.stringify(expectedParsed)
          finalStatus = isMatch ? "PASSED" : "FAILED"
        }

        const response = {
          submissionId,
          caseIdx,
          totalCases,
          isTest,
          status: finalStatus,
          actual:
            actualStr ||
            ("actualResult" in result ? String(result.actualResult) : ""),
          error: "error" in result ? result.error : null,
          runtime: "runtime" in result ? result.runtime : 0,
          memory: "memory" in result ? result.memory : 0,
          input: testCase.input,
          expected: testCase.expectedOutput,
        }

        await channel.assertQueue("result_queue", { durable: true })
        channel.sendToQueue(
          "result_queue",
          Buffer.from(JSON.stringify(response)),
          { persistent: true }
        )

        console.log(
          `[x] Finished task for submission ${submissionId}, case ${caseIdx}`
        )
        channel.ack(msg)
      }
    })
  } catch (error) {
    console.error("Failed to start worker:", error)
    process.exit(1)
  }
}

startWorker()
