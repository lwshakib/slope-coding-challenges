import express from "express";
import problemRoutes from "./problems.routes";
import contestRoutes from "./contests.routes";

const router = express.Router();

router.use("/problems", problemRoutes);
router.use("/contests", contestRoutes);

export default router;
