import express from "express"
import http from "http"
import cors from "cors"
import helmet from "helmet"
import { WEB_URL } from "./env.js"
import { errorHandler } from "./middlewares/error.middlewares.js"
import morganMiddleware from "./logger/morgan.logger.js"
import routes from "./routes/index.js"

const app = express()

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(
  cors({
    origin: WEB_URL || "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
)

app.use(helmet())
app.use(morganMiddleware)

app.get("/", (req, res) => {
  res.send("API is running")
})

app.get("/health", (req, res) => {
  res.send("API is healthy")
})

app.use("/api", routes)

app.use(errorHandler)

const httpServer = http.createServer(app)

export default httpServer
