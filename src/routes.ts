import { Router } from "express"
import ImportController from "./controllers/import"

const router = Router()

router.post("/check", ImportController.check)
router.post("/store", ImportController.store)

export default router
