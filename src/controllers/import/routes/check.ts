import { internalServerError, response } from "@ariefrahman39/shared-utils"
import type { RequestHandler } from "express"
import readXlsxFile from "read-excel-file/node"

const check: RequestHandler = async (req, res) => {
  try {
    const importDataEntry = Array.isArray(req.files)
      ? req.files?.find((file) => file.fieldname === "file")
      : req.files?.file

    const importData = Array.isArray(importDataEntry)
      ? importDataEntry[0]
      : importDataEntry

    if (!importData) {
      response(res, 400, "File not found")
      return
    }

    const data = await readXlsxFile(importData.buffer, {
      trim: true,
    })

    // Get and convert the header to snake_case
    const header = data[0] as string[]
    const snakeCaseHeader = header.map((key) => {
      return (
        key
          .toLowerCase()
          // Remove symbols
          .replace(/[^a-z0-9\s]+/g, "")
          // Replace spaces with underscores
          .replace(/\s+/g, "_")
      )
    })

    // Map the data rows to an object with snake_case keys
    const rows = data.slice(1).map((row) => {
      const obj: Record<string, any> = {}
      snakeCaseHeader.forEach((key, index) => {
        obj[key] = row[index]
      })
      return obj
    })

    // Gather certain columns, and rename them if provided a string
    const columnFormats: Record<string, string | boolean> = {
      machine_type: "machineType",
      manufacturer: "manufacturer",
      model: "model",
      type: "modelType",
      serial_no: "serialNo",
      customer_name: "customerName",
      location: "location",
      lat: "latitude",
      long: "longitude",
      transmit_time: "transmitTime",
      gps_time: "gpsTime",
      smrh: "smrHours",
      actual_working_hoursh: "actualWorkingHours",
    }

    // Check if all required columns are present
    const missingColumns = Object.keys(columnFormats).filter(
      (key) => !snakeCaseHeader.includes(key)
    )

    if (missingColumns.length > 0) {
      response(res, 422, "Missing required columns", {
        missingColumns,
      })
      return
    }

    const formattedRows = rows.map((row) => {
      const filteredRow: Record<string, any> = {}

      Object.keys(columnFormats).forEach((key) => {
        const value = row[key]
        const newKey = columnFormats[key]
        if (newKey) {
          if (typeof newKey === "string") {
            filteredRow[newKey] = value
          } else {
            filteredRow[key] = value
          }
        }
      })

      return filteredRow
    })

    response(res, 200, "Import data success", {
      parsedRows: formattedRows,
    })
  } catch (e) {
    console.error("Error importing data:", e)
    internalServerError(res, e)
  }
}

export default check