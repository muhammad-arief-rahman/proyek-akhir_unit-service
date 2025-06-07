import {
  internalServerError,
  response,
  zodCatchHandler,
  zodHandler,
} from "@ariefrahman39/shared-utils"
import type { RequestHandler } from "express"
import storeSchema, {
  storeItemSchema,
  type StoreItemSchema,
  type StoreSchema,
} from "../../../schema/unit/store"
import { ZodError } from "zod"
import type { Unit } from "../../../generated/prisma"
import prisma from "../../../lib/db"

export const store: RequestHandler = async (req, res) => {
  try {
    const data = req.body as unknown[]

    // * START: Workaround for Zod validation
    /**
     * Zod validation workaround for handling array of objects
     */

    // Parse and validate the entire request body
    const errors = data.map((item: unknown) => {
      try {
        storeItemSchema.parse(item)
      } catch (error) {
        return zodHandler(error as ZodError)
      }
    })

    // Validate the entire array of items
    if (errors.some((error) => error)) {
      res.status(422).json({
        message: "Validation error",
        errors: errors,
      })
    }

    // Assert data
    const parsedData = data as StoreSchema

    // * END: Workaround for Zod validation

    // Get unique units
    const uniqueUnits = parsedData.reduce((acc, curr) => {
      const { manufacturer, model, modelType } = curr

      const key = `${manufacturer}-${model}-${modelType}`

      if (!acc[key]) {
        acc[key] = {
          type: curr.machineType,
          manufacturer,
          model,
          modelType,
        }
      }

      return acc
    }, {} as Record<string, Partial<Unit>>)

    // Get Array of unique units
    const uniqueUnitsArray = Object.values(uniqueUnits)

    // Start transaction
    prisma.$transaction(async (tx) => {
      // * Step 1: Store unit data

      // Map to Prisma Unit type if possible
      const units = await Promise.all(
        uniqueUnitsArray.map(async (unit) => {
          try {
            const findFirst = await tx.unit.findFirst({
              where: {
                manufacturer: unit.manufacturer!,
                model: unit.model!,
                modelType: unit.modelType!,
                type: unit.type!,
              },
            })

            if (findFirst) {
              return findFirst
            }

            return await tx.unit.create({
              data: {
                type: unit.type!,
                manufacturer: unit.manufacturer!,
                model: unit.model!,
                modelType: unit.modelType!,
              },
            })
          } catch {
            return null
          }
        })
      )

      // * Step 2: Store unit instances
      // Map data to each instance
      const unitInstanceData = parsedData
        .map((item) => {
          const unit = units.find(
            (unit) =>
              unit?.manufacturer === item.manufacturer &&
              unit?.model === item.model &&
              unit?.modelType === item.modelType &&
              unit?.type === item.machineType
          )

          if (!unit) {
            return null
          }

          return {
            unitId: unit.id,
            serialNo: item.serialNo,
          }
        })
        .filter((item) => item !== null)

      const existingInstances = await tx.unitInstance.findMany({
        where: {
          OR: unitInstanceData.map((item) => ({
            serialNo: item.serialNo,
            unitId: item.unitId,
          })),
        },
        select: {
          serialNo: true,
          unitId: true,
        },
      })

      const unitInstances = await prisma.unitInstance.createManyAndReturn({
        data: unitInstanceData.filter((item) => item !== null),
      })

      response(res, 500, "DEBUG", {
        units: uniqueUnitsArray,
        instances: unitInstances,
        parsedData,
      })

      response(res, 200, "tamat", units)
    })
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(422).json({
        message: "Validation error",
        errors: error,
      })
    }

    internalServerError(res)
  }
}

export default store
