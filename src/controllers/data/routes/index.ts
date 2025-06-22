import {
  createResponsePagination,
  internalServerError,
  response,
} from "@ariefrahman39/shared-utils"
import type { RequestHandler } from "express"
import prisma from "../../../lib/db"

export const index: RequestHandler = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      sortBy = "createdAt",
      sortOrder = "desc",
      organizationId = "",
    } = req.query as Record<string, string>

    const whereQuery = {
      OR: [
        {
          instance: {
            unit: { manufacturer: { contains: search } },
          },
        },
        {
          instance: {
            unit: { model: { contains: search } },
          },
        },
        {
          instance: {
            unit: { modelType: { contains: search } },
          },
        },
        {
          instance: {
            serialNo: { contains: search },
          },
        },
      ],
      AND: [
        {
          instance: {
            organizationId: { contains: organizationId },
          },
        },
      ],
    }

    const operationalData = await prisma.operationalData.findMany({
      include: {
        instance: {
          include: {
            unit: true,
          },
        },
      },
      where: whereQuery,
      orderBy: {
        [sortBy]: sortOrder,
      },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
    })

    const totalOperationalData = await prisma.operationalData.count({
      where: whereQuery,
    })

    const totalPages = Math.ceil(totalOperationalData / Number(limit))

    response(
      res,
      200,
      "Fetched operational data successfully",
      operationalData,
      {
        pagination: createResponsePagination({
          data: operationalData,
          totalData: totalPages,
          page,
        }),
      }
    )
  } catch (error) {
    internalServerError(res, error)
  }
}
