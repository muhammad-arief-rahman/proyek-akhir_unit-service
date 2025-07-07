import express from "express"
import multer from "multer"
import router from "./src/routes"
import { response } from "@ariefrahman39/shared-utils"
import cookieparser from 'cookie-parser'

const app = express()
const port = process.env.PORT || 5002

app.use(express.json({ limit: "50mb" }))
app.use(multer().any())
app.use(cookieparser())

app.use("/", router)

app.use((req, res) => {
  response(res, 404, "Not Found")
})

app.listen(port, () => {
  console.log(`Unit-Service is running on port ${port}`)
})
