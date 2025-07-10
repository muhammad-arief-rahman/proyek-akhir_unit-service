import { internalServerError, response } from "@ariefrahman39/shared-utils"
import type { RequestHandler } from "express"
import prisma from "../../../lib/db"

const getMaintenanceByInstanceId: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params

    const unitInstance = await prisma.operationalData.findMany({
      where: {
        instanceId: id,
      },
      include: {
        instance: {
          include: {
            unit: true,
          },
        },
      },
      orderBy: {
        gpsTime: "desc",
      },
      take: 1,
    })

    const parsedInstance = unitInstance?.[0] ?? null

    if (!parsedInstance) {
      response(res, 404, "Unit instance not found")
      return
    }

    response(res, 200, "Unit operational data on instance found", parsedInstance)
  } catch (error) {
    internalServerError(res, error)
  }
}

export default getMaintenanceByInstanceId
