import { z } from "zod"

export const storeItemSchema = z.object({
  machineType: z.string().min(1, "Machine type must not be empty"),
  manufacturer: z.string().min(1, "Manufacturer must not be empty"),
  model: z.string().min(1, "Model must not be empty"),
  modelType: z.string().min(1, "Model type must not be empty"),
  serialNo: z.string().min(1, "Serial number must not be empty"),
  customerName: z.string().min(1, "Customer name must not be empty"),
  location: z.string().min(1, "Location must not be empty"),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  transmitTime: z.string().min(1, "Transmit time must not be empty").refine(
    (val) => {
      const date = new Date(val)
      return !isNaN(date.getTime())
    },
    {
      message: "Transmit time must be a valid date string",
    }
  ),
  gpsTime: z.string().min(1, "GPS time must not be empty").refine(
    (val) => {
      const date = new Date(val)
      return !isNaN(date.getTime())
    },
    {
      message: "GPS time must be a valid date string",
    }
  ),
  smrHours: z.number().min(0, "SMR hours must be a positive number"),
  actualWorkingHours: z.number().min(0, "Actual working hours must be a positive number").nullable(),
})

const storeSchema = z.array(storeItemSchema).min(1)

export default storeSchema

export type StoreItemSchema = z.infer<typeof storeItemSchema>
export type StoreSchema = z.infer<typeof storeSchema>
