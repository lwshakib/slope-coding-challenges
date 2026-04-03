import rabbitmqService from "../../services/rabbitmq.services";
import postgresService from "../../services/postgres.services";
import logger from "../../logger/winston.logger";

export const startResultConsumer = async () => {
    const channel = rabbitmqService.getChannel();
    const queue = "result_queue";

    await channel.assertQueue(queue, { durable: true });

    channel.consume(queue, async (msg) => {
        if (msg !== null) {
            const client = await postgresService.connect();
            try {
                const data = JSON.parse(msg.content.toString());
                logger.info(`Received result: ${JSON.stringify(data)}`);
                const { submissionId, status, caseIdx, totalCases, isTest, ...resultDetails } = data;

                await client.query('BEGIN');

                let testRun = null;
                let submission = null;

                // 1. Find the record
                if (isTest) {
                    const res = await client.query('SELECT * FROM test_run WHERE id = $1', [submissionId]);
                    testRun = res.rows[0];
                    if (!testRun) {
                        const resSub = await client.query('SELECT * FROM submission WHERE id = $1', [submissionId]);
                        submission = resSub.rows[0];
                    }
                } else {
                    const res = await client.query('SELECT * FROM submission WHERE id = $1', [submissionId]);
                    submission = res.rows[0];
                    if (!submission) {
                        const resTr = await client.query('SELECT * FROM test_run WHERE id = $1', [submissionId]);
                        testRun = resTr.rows[0];
                    }
                }

                const effectiveIsTest = !!testRun;
                const recordId = submissionId;

                if (!testRun && !submission) {
                    logger.warn(`Processing result for ${isTest ? 'test run' : 'submission'} ${submissionId} but record not found in DB. Skipping.`);
                    await client.query('ROLLBACK');
                    channel.ack(msg);
                    return;
                }

                // Update status to PENDING
                if (effectiveIsTest) {
                    await client.query('UPDATE test_run SET status = $1 WHERE id = $2', ["PENDING", recordId]);
                } else {
                    await client.query('UPDATE submission SET status = $1 WHERE id = $2', ["PENDING", recordId]);
                }

                // 2. Create the test case result
                const resultId = crypto.randomUUID();
                if (effectiveIsTest) {
                    await client.query(
                        `INSERT INTO test_run_result (id, "testRunId", "caseIdx", status, input, expected, actual, error, runtime, memory) 
                         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
                        [
                            resultId, recordId, caseIdx, status, 
                            resultDetails.input || "", 
                            resultDetails.expected || "", 
                            resultDetails.actual?.toString(), 
                            resultDetails.error, 
                            resultDetails.runtime, 
                            resultDetails.memory
                        ]
                    );
                } else {
                    await client.query(
                        `INSERT INTO test_case_result (id, "submissionId", "caseIdx", status, input, expected, actual, error, runtime, memory) 
                         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
                        [
                            resultId, recordId, caseIdx, status, 
                            resultDetails.input || "", 
                            resultDetails.expected || "", 
                            resultDetails.actual?.toString(), 
                            resultDetails.error, 
                            resultDetails.runtime, 
                            resultDetails.memory
                        ]
                    );
                }

                // 3. Count existing results
                let resultsCount = 0;
                if (effectiveIsTest) {
                    const countRes = await client.query('SELECT COUNT(*)::int FROM test_run_result WHERE "testRunId" = $1', [recordId]);
                    resultsCount = countRes.rows[0].count;
                } else {
                    const countRes = await client.query('SELECT COUNT(*)::int FROM test_case_result WHERE "submissionId" = $1', [recordId]);
                    resultsCount = countRes.rows[0].count;
                }

                // 4. If all cases are in, update
                if (resultsCount === totalCases) {
                    let allResults: any[] = [];
                    if (effectiveIsTest) {
                        const resultsRes = await client.query('SELECT * FROM test_run_result WHERE "testRunId" = $1 ORDER BY "caseIdx" ASC', [recordId]);
                        allResults = resultsRes.rows;
                    } else {
                        const resultsRes = await client.query('SELECT * FROM test_case_result WHERE "submissionId" = $1 ORDER BY "caseIdx" ASC', [recordId]);
                        allResults = resultsRes.rows;
                    }

                    const anyFailed = allResults.some((r: any) => r.status !== "PASSED");
                    const totalRuntime = allResults.reduce((acc: number, r: any) => acc + (r.runtime || 0), 0);
                    const maxMemory = Math.max(...allResults.map((r: any) => r.memory || 0));
                    
                    const finalStatus = anyFailed ? "FAILED" : "ACCEPTED";
                    const outputStr = JSON.stringify(allResults.map((r: any) => ({
                        caseIdx: r.caseIdx,
                        status: r.status,
                        input: r.input,
                        expected: r.expected,
                        actual: r.actual,
                        error: r.error,
                        runtime: r.runtime,
                        memory: r.memory
                    })));

                    if (effectiveIsTest) {
                        logger.info(`Updating test run ${recordId}`);
                        await client.query(
                            'UPDATE test_run SET status = $1, runtime = $2, memory = $3, output = $4 WHERE id = $5',
                            [finalStatus, totalRuntime, maxMemory, outputStr, recordId]
                        );
                    } else {
                        logger.info(`Updating submission ${recordId}`);
                        const updateRes = await client.query(
                            'UPDATE submission SET status = $1, runtime = $2, memory = $3, output = $4 WHERE id = $5 RETURNING *',
                            [finalStatus, totalRuntime, maxMemory, outputStr, recordId]
                        );
                        const updatedSubmission = updateRes.rows[0];

                        // Handle contest progress
                        if (!anyFailed && updatedSubmission.contestId) {
                            const cpRes = await client.query(
                                'SELECT * FROM contest_problem WHERE "contestId" = $1 AND "problemSlug" = $2',
                                [updatedSubmission.contestId, updatedSubmission.problemSlug]
                            );
                            const contestProblem = cpRes.rows[0];

                            if (contestProblem) {
                                const progRes = await client.query(
                                    'SELECT * FROM contest_progress WHERE "contestId" = $1 AND "userId" = $2',
                                    [updatedSubmission.contestId, updatedSubmission.userId]
                                );
                                const currentProgress = progRes.rows[0];

                                const newProgressOrder = contestProblem.order + 1;
                                
                                if (!currentProgress || currentProgress.currentOrder < newProgressOrder) {
                                    await client.query(
                                        `INSERT INTO contest_progress ("contestId", "userId", "currentOrder") 
                                         VALUES ($1, $2, $3) 
                                         ON CONFLICT ("contestId", "userId") 
                                         DO UPDATE SET "currentOrder" = EXCLUDED."currentOrder"`,
                                        [updatedSubmission.contestId, updatedSubmission.userId, newProgressOrder]
                                    );
                                    logger.info(`Advanced contest progress for user ${updatedSubmission.userId} in contest ${updatedSubmission.contestId} to problem ${newProgressOrder}`);
                                }
                            }
                        }
                    }
                    
                    logger.info(`Completed ${effectiveIsTest ? 'test run' : 'submission'} ${recordId}. Status: ${finalStatus}`);
                }

                logger.info(`Processed test case ${caseIdx + 1}/${totalCases} for ${effectiveIsTest ? 'test run' : 'submission'} ${recordId}. Status: ${status}`);
                
                await client.query('COMMIT');
                channel.ack(msg);
            } catch (error) {
                await client.query('ROLLBACK');
                logger.error("Error processing result message:", error);
                channel.nack(msg);
            } finally {
                client.release();
            }
        }
    });
};
