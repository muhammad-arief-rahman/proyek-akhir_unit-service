import { internalServerError } from "@ariefrahman39/shared-utils"
import type { RequestHandler } from "express"
import prisma from "../../../lib/db"

const getAll: RequestHandler = async (req, res) => {
  try {
  } catch (error) {
    internalServerError(res, error)
  }
}

export default getAll
