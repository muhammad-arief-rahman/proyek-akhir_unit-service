import { internalServerError, response } from "@ariefrahman39/shared-utils"
import type { RequestHandler } from "express"
import prisma from "../../../lib/db"

const baseUnit: RequestHandler = async (req, res) => {
  try {
    const {withCompound = "false"} = req.query as Record<string, string>
    
    const units = await prisma.unit.findMany({

    })

    const formattedUnits = units.map((unit) => ({
      ...unit,
      compound: withCompound === 'true' ? `${unit.model}-${unit.modelType}` : undefined
    }))

    response(res, 200, "Base units retrieved successfully", formattedUnits)
  } catch (error) {
    internalServerError(res, error)
  }
}

export default baseUnit