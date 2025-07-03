import { internalServerError, response } from "@ariefrahman39/shared-utils"
import type { RequestHandler } from "express"
import prisma from "../../../lib/db"
import { createWhereQuery } from "./getAll"

const summary: RequestHandler = async (req, res) => {
  try {
    const {
      search = "",
      customerId = "",
      unitId = "",
      compoundUnit = "",
    } = req.query as Record<string, string>

    const whereQuery = createWhereQuery({
      search,
      customerId,
      compoundUnit,
      unitId,
    })

    const totalWorkHours = await prisma.operationalData.aggregate({
      _sum: {
        actualWorkHours: true,
      },
      where: whereQuery,
    })

    const totalIdleTime = await prisma.operationalData.aggregate({
      _sum: {
        idleTime: true,
      },
      where: whereQuery,
    })

    const totalFuelConsumption = await prisma.operationalData.aggregate({
      _sum: {
        fuelUsage: true,
      },
      where: whereQuery,
    })

    const averageFuelConsumption = await prisma.operationalData.aggregate({
      _avg: {
        fuelUsage: true,
      },
      where: whereQuery,
    })

    response(res, 200, "Fetched unit summary successfully", {
      totalWorkHours: (totalWorkHours._sum.actualWorkHours ?? 0).toFixed(2),
      totalIdleTime: (totalIdleTime._sum.idleTime ?? 0).toFixed(2),
      totalFuelConsumption: (totalFuelConsumption._sum.fuelUsage ?? 0).toFixed(
        2
      ),
      averageFuelConsumption: (
        averageFuelConsumption._avg.fuelUsage ?? 0
      ).toFixed(2),
    })
  } catch (error) {
    internalServerError(res, error)
  }
}

export default summary
