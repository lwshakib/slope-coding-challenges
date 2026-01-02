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
                const { submissionId, status, caseIdx, totalCases, ...resultDetails } = data;

                await prisma.$transaction(async (tx) => {
                    // Lock the submission row to prevent race conditions during aggregation
                    // We update the status to its current value to trigger a row lock without changing data
                    await tx.submission.update({
                        where: { id: submissionId },
                        data: { status: "PENDING" }
                    });

                    // 1. Create the test case result
                    await tx.testCaseResult.create({
                        data: {
                            submissionId,
                            caseIdx,
                            status,
                            input: resultDetails.input || "",
                            expected: resultDetails.expected || "",
                            actual: resultDetails.actual?.toString(),
                            error: resultDetails.error,
                            runtime: resultDetails.runtime
                        }
                    });

                    // 2. Count existing results for this submission
                    const resultsCount = await tx.testCaseResult.count({
                        where: { submissionId }
                    });

                    // 3. If all cases are in, update the submission
                    if (resultsCount === totalCases) {
                        const allResults = await tx.testCaseResult.findMany({
                            where: { submissionId },
                            orderBy: { caseIdx: 'asc' }
                        });

                        const anyFailed = allResults.some((r: any) => r.status !== "PASSED");
                        
                        await tx.submission.update({
                            where: { id: submissionId },
                            data: {
                                status: anyFailed ? "FAILED" : "ACCEPTED",
                                output: JSON.stringify(allResults.map((r: any) => ({
                                    caseIdx: r.caseIdx,
                                    status: r.status,
                                    input: r.input,
                                    expected: r.expected,
                                    actual: r.actual,
                                    error: r.error,
                                    runtime: r.runtime
                                })))
                            }
                        });
                        
                        logger.info(`Completed submission ${submissionId}. Status: ${anyFailed ? "FAILED" : "ACCEPTED"}`);
                    }

                    logger.info(`Processed test case ${caseIdx + 1}/${totalCases} for submission ${submissionId}. Status: ${status}`);
                });

                channel.ack(msg);
            } catch (error) {
                logger.error("Error processing result message:", error);
                channel.nack(msg);
            }
        }
    });
};
