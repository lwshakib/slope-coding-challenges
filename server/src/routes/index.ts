import express from "express";
import problemRoutes from "./problems.routes";
import userRoutes from "./user.routes";

const router = express.Router();

router.use("/problems", problemRoutes);
router.use("/users", userRoutes);

export default router;
