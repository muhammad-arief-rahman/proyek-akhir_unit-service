import { Router } from "express"
import ImportController from "./controllers/import"
import DataController from "./controllers/data"
import CustomerController from "./controllers/customer"
import { AuthMiddleware } from "@ariefrahman39/shared-utils"

const router = Router()

router.post("/import/check", ImportController.check)
router.post("/import/store", ImportController.store)

// router.get("/customers", CustomerController.getAll)

router.get("/data", DataController.index)
router.get("/data/summary", DataController.summary)
router.get("/base-data", DataController.baseUnit)
router.get('/data/instance/:id', DataController.getInstanceById)
router.get("/data/instance/:id/maintenance", DataController.getMaintenanceByInstanceId)

router.get("/customer-summary/:id", CustomerController.summary)

export default router
