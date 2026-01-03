import { getChannel } from "../../services/rabbitmq.services";
import { prisma } from "../../services/prisma.services";
import logger from "../../logger/winston.logger";

export const startResultConsumer = async () => {
    const channel = getChannel();
    const queue = "result_queue";

    await channel.assertQueue(queue, { durable: true });

    channel.consume(queue, async (msg) => {
        if (msg !== null) {
            try {
                const data = JSON.parse(msg.content.toString());
                logger.info(`Received result: ${JSON.stringify(data)}`);
                const { submissionId, status, caseIdx, totalCases, isTest, ...resultDetails } = data;

                await prisma.$transaction(async (tx) => {
                    let testRun = null;
                    let submission = null;

                    // 1. Find the record (try both TestRun and Submission if needed)
                    if (isTest) {
                        testRun = await (tx as any).testRun.findUnique({ where: { id: submissionId } });
                        if (!testRun) {
                            submission = await (tx as any).submission.findUnique({ where: { id: submissionId } });
                        }
                    } else {
                        submission = await (tx as any).submission.findUnique({ where: { id: submissionId } });
                        if (!submission) {
                            testRun = await (tx as any).testRun.findUnique({ where: { id: submissionId } });
                        }
                    }

                    // Determine the actual type based on what we found
                    const effectiveIsTest = !!testRun;
                    const recordId = submissionId;

                    if (!testRun && !submission) {
                        logger.warn(`Processing result for ${isTest ? 'test run' : 'submission'} ${submissionId} but record not found in DB. Skipping.`);
                        return;
                    }

                    // Update status to PENDING if not already
                    if (effectiveIsTest) {
                        await (tx as any).testRun.update({
                            where: { id: recordId },
                            data: { status: "PENDING" }
                        });
                    } else {
                        await (tx as any).submission.update({
                            where: { id: recordId },
                            data: { status: "PENDING" }
                        });
                    }

                    // 2. Create the test case result
                    if (effectiveIsTest) {
                        await (tx as any).testRunResult.create({
                            data: {
                                testRunId: recordId,
                                caseIdx,
                                status,
                                input: resultDetails.input || "",
                                expected: resultDetails.expected || "",
                                actual: resultDetails.actual?.toString(),
                                error: resultDetails.error,
                                runtime: resultDetails.runtime,
                                memory: resultDetails.memory
                            }
                        });
                    } else {
                        await tx.testCaseResult.create({
                            data: {
                                submissionId: recordId,
                                caseIdx,
                                status,
                                input: resultDetails.input || "",
                                expected: resultDetails.expected || "",
                                actual: resultDetails.actual?.toString(),
                                error: resultDetails.error,
                                runtime: resultDetails.runtime,
                                memory: resultDetails.memory
                            }
                        });
                    }

                    // 3. Count existing results
                    let resultsCount = 0;
                    if (effectiveIsTest) {
                        resultsCount = await (tx as any).testRunResult.count({
                            where: { testRunId: recordId }
                        });
                    } else {
                        resultsCount = await tx.testCaseResult.count({
                            where: { submissionId: recordId }
                        });
                    }

                    // 4. If all cases are in, update
                    if (resultsCount === totalCases) {
                        let allResults: any[] = [];
                        if (effectiveIsTest) {
                            allResults = await (tx as any).testRunResult.findMany({
                                where: { testRunId: recordId },
                                orderBy: { caseIdx: 'asc' }
                            });
                        } else {
                            allResults = await tx.testCaseResult.findMany({
                                where: { submissionId: recordId },
                                orderBy: { caseIdx: 'asc' }
                            });
                        }

                        const anyFailed = allResults.some((r: any) => r.status !== "PASSED");
                        const totalRuntime = allResults.reduce((acc: number, r: any) => acc + (r.runtime || 0), 0);
                        const maxMemory = Math.max(...allResults.map((r: any) => r.memory || 0));
                        
                        const updateData = {
                            status: anyFailed ? "FAILED" : "ACCEPTED",
                            runtime: totalRuntime,
                            memory: maxMemory,
                            output: JSON.stringify(allResults.map((r: any) => ({
                                caseIdx: r.caseIdx,
                                status: r.status,
                                input: r.input,
                                expected: r.expected,
                                actual: r.actual,
                                error: r.error,
                                runtime: r.runtime,
                                memory: r.memory
                            })))
                        };

                        if (effectiveIsTest) {
                            logger.info(`Updating test run ${recordId} (type: ${typeof recordId})`);
                            await (tx as any).testRun.update({
                                where: { id: recordId },
                                data: updateData
                            });
                        } else {
                            logger.info(`Updating submission ${recordId} (type: ${typeof recordId})`);
                            const updatedSubmission = await (tx as any).submission.update({
                                where: { id: recordId },
                                data: updateData
                            });

                            // Handle contest progress
                            if (!anyFailed && updatedSubmission.contestId) {
                                const contestProblem = await (tx as any).contestProblem.findUnique({
                                    where: {
                                        contestId_problemSlug: {
                                            contestId: updatedSubmission.contestId,
                                            problemSlug: updatedSubmission.problemSlug
                                        }
                                    }
                                });

                                if (contestProblem) {
                                    // Check current progress and only update if we're advancing
                                    const currentProgress = await (tx as any).contestProgress.findUnique({
                                        where: {
                                            contestId_userId: {
                                                contestId: updatedSubmission.contestId,
                                                userId: updatedSubmission.userId
                                            }
                                        }
                                    });

                                    const newProgressOrder = contestProblem.order + 1;
                                    
                                    // Only update if this advances the progress
                                    if (!currentProgress || currentProgress.currentOrder < newProgressOrder) {
                                        await (tx as any).contestProgress.upsert({
                                            where: {
                                                contestId_userId: {
                                                    contestId: updatedSubmission.contestId,
                                                    userId: updatedSubmission.userId
                                                }
                                            },
                                            update: { currentOrder: newProgressOrder },
                                            create: {
                                                contestId: updatedSubmission.contestId,
                                                userId: updatedSubmission.userId,
                                                currentOrder: newProgressOrder
                                            }
                                        });
                                        logger.info(`Advanced contest progress for user ${updatedSubmission.userId} in contest ${updatedSubmission.contestId} to problem ${newProgressOrder}`);
                                    }
                                }
                            }
                        }
                        
                        logger.info(`Completed ${effectiveIsTest ? 'test run' : 'submission'} ${recordId}. Status: ${anyFailed ? "FAILED" : "ACCEPTED"}`);
                    }

                    logger.info(`Processed test case ${caseIdx + 1}/${totalCases} for ${effectiveIsTest ? 'test run' : 'submission'} ${recordId}. Status: ${status}`);
                });

                channel.ack(msg);
            } catch (error) {
                logger.error("Error processing result message:", error);
                channel.nack(msg);
            }
        }
    });
};
