import { internalServerError, response } from "@ariefrahman39/shared-utils"
import type { RequestHandler } from "express"
import prisma from "../../../lib/db"

const getInstanceById: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params

    const unitInstance = await prisma.unitInstance.findUnique({
      where: { id },
      include: {
        unit: true,
        operationalData: true,
      }
    })

    if (!unitInstance) {
      response(res, 404, "Unit instance not found")
      return
    }

    response(res, 200, "Unit instance found", unitInstance)
  } catch (error) {
    internalServerError(res, error)
  }
}

export default getInstanceById
