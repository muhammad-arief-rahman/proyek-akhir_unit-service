import { internalServerError, response } from "@ariefrahman39/shared-utils"
import type { RequestHandler } from "express"
import prisma from "../../../lib/db"

const summary: RequestHandler = async (req, res) => {
  try {
    const { id: customerId } = req.params

    const totalUnits = await prisma.unitInstance.count({
      where: {
        organizationId: customerId,
      }
    })

    const totalUnitCategories = await Promise.resolve(0)

    const totalOperationalData = await prisma.operationalData.count({
      where: {
        instance: {
          organizationId: customerId,
        }
      }
    })

    response(res, 200, "Customer summary retrieved successfully", {
      totalUnits,
      totalUnitCategories,
      totalOperationalData,
    })
  } catch (error) {
    internalServerError(res, error)
  }
}

export default summary
