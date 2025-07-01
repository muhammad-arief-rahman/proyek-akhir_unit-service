import { internalServerError, response } from "@ariefrahman39/shared-utils"
import type { RequestHandler } from "express"
import prisma from "../../../lib/db"
import { createWhereQuery } from "."

const summary: RequestHandler = async (req, res) => {
  try {
    const { search = "", organizationId = "" } = req.query as Record<string, string>

    const totalWorkHours = await prisma.operationalData.aggregate({
      _sum: {
        actualWorkHours: true,
      },
      where: createWhereQuery({
        search,
        organizationId,
      }),
    })

    response(res, 200, "Fetched unit summary successfully", {
      totalWorkHours: totalWorkHours._sum.actualWorkHours,
      totalIdleTime: 300,
      totalFuelConsumption: 1500,
      averageFuelConsumption: 1.25,
    })
  } catch (error) {
    internalServerError(res, error)
  }
}

export default summary
