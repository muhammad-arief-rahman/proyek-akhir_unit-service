import {
  createResponsePagination,
  internalServerError,
  response,
} from "@ariefrahman39/shared-utils"
import type { Request, RequestHandler } from "express"
import prisma from "../../../lib/db"
import type { Prisma } from "../../../generated/prisma"

export const createWhereQuery = ({
  search = "",
  organizationId = "",
  customerId = "",
}: {
  search: string
  organizationId: string
  customerId: string
}): Prisma.OperationalDataWhereInput => ({
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
  ...(customerId && {
    instance: {
      organizationId: { contains: customerId },
    }
  })
})

const index: RequestHandler = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      sortBy = "createdAt",
      sortOrder = "desc",
      organizationId = "",
      noPagination = "false",
      customerId = "",
    } = req.query as Record<string, string>

    const whereQuery = createWhereQuery({
      search,
      organizationId,
      customerId,
    })
    
    // Get latest operational data ID for each instance
    const latestDataIds = await prisma.operationalData.groupBy({
      by: ["instanceId"],
      _max: {
        id: true,
        createdAt: true,
      },
      where: whereQuery,
    })

    // Extract the latest operational data IDs
    const latestIds = latestDataIds
      .map((data) => data._max.id)
      .filter(Boolean) as string[]

    if (noPagination === "true") {
      const operationalData = await prisma.operationalData.findMany({
        include: {
          instance: {
            include: {
              unit: true,
            },
          },
        },
        where: {
          id: { in: latestIds },
        },
      })

      response(
        res,
        200,
        "Fetched operational data successfully",
        operationalData
      )
      return
    }

    const operationalData = await prisma.operationalData.findMany({
      include: {
        instance: {
          include: {
            unit: true,
          },
        },
      },
      where: {
        id: { in: latestIds },
      },
      orderBy: {
        [sortBy]: sortOrder,
      },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
    })

    const totalOperationalData = await prisma.operationalData.count({
      where: {
        id: { in: latestIds },
      }
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

export default index

export { default as summary } from "./summary"
