import express from "express";
import problemRoutes from "./problems.routes";
import contestRoutes from "./contests.routes";
import userRoutes from "./user.routes";

const router = express.Router();

router.use("/problems", problemRoutes);
router.use("/contests", contestRoutes);
router.use("/users", userRoutes);

export default router;
