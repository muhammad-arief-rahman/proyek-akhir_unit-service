import {
  getAuthToken,
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
import axios, { AxiosError } from "axios"

export const store: RequestHandler = async (req, res) => {
  console.log("Storing data...")

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
      return
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

      console.log("Storing units...")

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

      // * Step 2: Add customer data
      // Group by customer organization ID
      const customerData = parsedData.reduce((acc, curr) => {
        const { customerOrganizationId, customerName, customerIndustry } = curr

        if (!acc[customerOrganizationId]) {
          acc[customerOrganizationId] = {
            organizationId: customerOrganizationId,
            name: customerName,
            industry: customerIndustry,
            subGroup: curr.subGroup,
          }
        }

        return acc
      }, {} as Record<string, any>)

      // Flatten into an array
      const flattenedCustomerData = Object.values(customerData)

      const customerResponse = await axios.post(
        `${process.env.CUSTOMER_SERVICE_URL}/data/store`,
        flattenedCustomerData,
        {
          headers: {
            "Content-Type": "application/json",
            "X-Service-Secret": process.env.SERVICE_SECRET || "",
            "Authorization": `Bearer ${getAuthToken(req)}`,
          },
        }
      )

      
      // Get new customer data

      const newCustomerResponse = await axios.get(
        `${process.env.CUSTOMER_SERVICE_URL}/data`,
        {
          headers: {
            Authorization: `Bearer ${getAuthToken(req)}`,
          },
        }
      )

      const newCustomers = newCustomerResponse.data.data as any[]

      // * Step 3: Store unit instances
      // Map data to each instance
      const unitInstances = await Promise.all(
        parsedData.map(async (item) => {
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

          const customerByOrganizationId = newCustomers.find(
            (customer) =>
              customer.organizationId === item.customerOrganizationId
          )

          const existingInstance = await tx.unitInstance.findFirst({
            where: {
              serialNo: item.serialNo,
              unitId: unit.id,
            },
          })

          if (existingInstance) {
            // Add customer organization ID if it doesn't exist
            if (
              existingInstance.organizationId !== customerByOrganizationId?.id
            ) {
              return await tx.unitInstance.update({
                where: {
                  id: existingInstance.id,
                },
                data: {
                  organizationId: customerByOrganizationId?.id,
                },
              })
            }

            return existingInstance
          }

          return await tx.unitInstance.create({
            data: {
              unitId: unit.id,
              serialNo: item.serialNo,
              organizationId: customerByOrganizationId?.id || "",
            },
          })
        })
      )

      const filteredInstances = unitInstances.filter(
        (instance) => instance !== null
      )

      console.log("Creating operational data...")

      // * Step 4: Create operational data for each unit instance
      const operationalData = parsedData.map((item) => {
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

        const instance = filteredInstances.find(
          (instance) =>
            instance.serialNo === item.serialNo && instance.unitId === unit.id
        )

        if (!instance) {
          return null
        }

        // Check if certain data is null or undefined
        if (
          item.latitude === null ||
          item.longitude === null ||
          item.workingHours === null ||
          item.actualWorkingHours === null ||
          item.fuelConsumed === null
        ) {
          return null
        }

        return {
          instanceId: instance.id,
          workHours: item.workingHours,
          actualWorkHours: item.actualWorkingHours,
          longitude: item.longitude,
          latitude: item.latitude,
          fuelUsage: item.fuelConsumed,
          smr: item.smrHours,
          gpsTime: new Date(item.gpsTime).toISOString(),
        } satisfies Parameters<typeof tx.operationalData.upsert>[0]["create"]
      })

      // Filter out null values
      const filteredOperationalData = operationalData.filter(
        (item) => item !== null
      )

      // Upsert operational data in the database
      const operationalDataUpsert = await Promise.all(
        filteredOperationalData.map(async (data) => {
          return await tx.operationalData.upsert({
            where: {
              instanceId_gpsTime: {
                instanceId: data.instanceId,
                gpsTime: data.gpsTime,
              },
            },
            update: data,
            create: data,
          })
        })
      )
    })

    response(res, 200, "Data stored successfully", {
      message: "Data stored successfully",
    })
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(422).json({
        message: "Validation error",
        errors: error,
      })
      return
    }

    internalServerError(res)
  }
}

export default store
