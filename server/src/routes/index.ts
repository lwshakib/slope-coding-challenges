import express from "express";
import problemRoutes from "./problems.routes";

const router = express.Router();

router.use("/problems", problemRoutes);

export default router;
