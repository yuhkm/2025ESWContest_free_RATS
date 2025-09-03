import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import fs from "fs";
import path from "path";
import HTTPS from "https";
import { initializeWebSocket } from "./ws/ws.gateway.js";
import swaggerAutogen from "swagger-autogen";
import swaggerUiExpress from "swagger-ui-express";
import apiRoute from "./routes/index.js";
import { addDevice } from "./repositories/driving.repository.js";

dotenv.config();

const app = express();
const port = process.env.PORT;

const corsOptions = {
  origin: "*",
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  preflightContinue: false,
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  res.success = (success) => {
    return res.json({ resultType: "SUCCESS", error: null, success });
  };
  res.error = ({ errorCode = "unknown", reason = null, data = null }) => {
    return res.json({
      resultType: "FAIL",
      error: { errorCode, reason, data },
      success: null,
    });
  };
  next();
});

app.use(
  "/docs",
  swaggerUiExpress.serve,
  swaggerUiExpress.setup(
    {},
    {
      swaggerOptions: {
        url: "/openapi.json",
      },
    }
  )
);

app.get("/openapi.json", async (req, res, next) => {
  // #swagger.ignore = true
  const options = {
    openapi: "3.0.0",
    disableLogs: true,
    writeOutputFile: false,
  };
  const outputFile = "/dev/null";
  const routes = ["./src/index.js"];
  const protocol = req.protocol;
  const host = req.get("host");
  const doc = {
    info: {
      title: "MJU RATS",
      description: "초보 운전자를 위한 차량 보조 서비스",
    },
    host: `${protocol}://${host}`,
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  };

  const result = await swaggerAutogen(options)(outputFile, routes, doc);
  res.json(result ? result.data : null);
});

app.post("/v1/api/device", (req, res) => {
  addDevice({
    status: false,
  });
  res.status(200).send("임시용 디바이스 등록");
});
app.use("/v1/api/", apiRoute);

app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  res.status(err.statusCode || 500).error({
    errorCode: err.errorCode || "unknown",
    reason: err.reason || err.message || null,
    data: err.data || null,
  });
});

const isSSL = process.env.SSL_ENABLED === "true";

if (isSSL) {
  const option = {
    ca: fs.readFileSync(process.env.CA_PATH),
    key: fs
      .readFileSync(path.resolve(process.cwd(), process.env.KEY_PATH), "utf8")
      .toString(),
    cert: fs
      .readFileSync(path.resolve(process.cwd(), process.env.CERT_PATH), "utf8")
      .toString(),
  };

  const httpsServer = HTTPS.createServer(option, app);

  initializeWebSocket(httpsServer);

  httpsServer.listen(port, () => {
    console.log(`[HTTPS+WS] Server is running on port ${port}`);
  });
} else {
  const httpServer = app.listen(port, () => {
    console.log(`[HTTP] Server is running on http://localhost:${port}`);
  });

  initializeWebSocket(httpServer);
}
