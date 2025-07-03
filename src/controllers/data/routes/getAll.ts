import {
  createResponsePagination,
  internalServerError,
  response,
} from "@ariefrahman39/shared-utils"
import prisma from "../../../lib/db"
import type { RequestHandler } from "express"
import type { Prisma } from "../../../generated/prisma"

export const createWhereQuery = ({
  search = "",
  customerId = "",
  compoundUnit = "",
  unitId = "",
}: {
  search: string
  customerId: string
  compoundUnit: string
  unitId: string
}): Prisma.OperationalDataWhereInput => {
  const baseQuery: Prisma.OperationalDataWhereInput = {
    instance: {
      organizationId: { contains: customerId },
    },
  }

  if (search) {
    baseQuery.OR = [
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
    ]
  }

  if (compoundUnit) {
    const [model = "", modelType = ""] = compoundUnit.split("-") || ["", ""]

    if (model && modelType) {
      baseQuery.instance = {
        ...baseQuery.instance as Prisma.UnitInstanceWhereInput,
        unit: {
          model: { contains: model },
          modelType: { contains: modelType },
        },
      }
    }
  }

  if (unitId) {
    baseQuery.instance = {
      ...baseQuery.instance as Prisma.UnitInstanceWhereInput,
      unitId: unitId,
    }
  }

  return baseQuery
}

const getAll: RequestHandler = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      sortBy = "createdAt",
      sortOrder = "desc",
      customerId = "",
      noPagination = "false",
      compoundUnit = "",
      unitId = "",
    } = req.query as Record<string, string>

    const whereQuery = createWhereQuery({
      search,
      customerId,
      compoundUnit,
      unitId,
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
      },
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

export default getAll
