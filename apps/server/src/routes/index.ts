import { Router } from "express"
import problemRoutes from "./problems.routes.js"
import userRoutes from "./user.routes.js"

const router: Router = Router()

router.use("/problems", problemRoutes)
router.use("/users", userRoutes)

export default router
