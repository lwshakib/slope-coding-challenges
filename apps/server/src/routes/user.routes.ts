import { Router } from "express"
import { getProfile } from "../controllers/user.controller.js"

const router: Router = Router()

router.get("/profile", getProfile)

export default router
