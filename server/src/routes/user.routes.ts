import express from "express";
import { getProfile } from "../controllers/user.controller";

const router = express.Router();

router.get("/profile", getProfile);

export default router;
