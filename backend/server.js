import chalk from "chalk";
import path from "path";
import cookieParser from "cookie-parser";
import "dotenv/config";
import express from "express";
import morgan from "morgan";
import connectionDB from "./config/connectDB.js";
import { morganMiddleware, systemLogs } from "./utils/logger.js";
import mongoSanitize from "express-mongo-sanitize";
import { errorHandler, notFound } from "./middleware/errorMiddleware.js";
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import customerRoutes from "./routes/customer.routes.js";
import documentRoutes from "./routes/document.routes.js";
import uploadRoutes from "./routes/upload.routes.js";
import { apiLimiter } from "./middleware/apiLimiter.js";
import passport from "passport";
import googleAuth from "./config/passportSetup.js";

await connectionDB();

const app = express();

const __dirname = path.resolve();
app.use("/uploads", express.static(path.join(__dirname, "/uploads")));
app.use("/docs", express.static(path.join(__dirname, "/docs")));

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

app.use(express.json());

app.use(express.urlencoded({ extended: false }));

app.use(passport.initialize());
googleAuth();

app.use(cookieParser());
app.use(mongoSanitize());

app.use(morganMiddleware);

app.get("/api/v1/test", (req, res) => {
  res.json({ Hi: "Welcome to the Invoice App" });
});

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/user", apiLimiter, userRoutes);
app.use("/api/v1/customer", apiLimiter, customerRoutes);
app.use("/api/v1/document", apiLimiter, documentRoutes);
app.use("/api/v1/upload", apiLimiter, uploadRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 1008;

app.listen(PORT, () => {
  console.log(
    `${chalk.green.bold("✔")} 👍 Server running in ${chalk.yellow.bold(
      process.env.NODE_ENV
    )} mode on port ${chalk.blue.bold(PORT)}`
  );
  systemLogs.info(
    `Server running in ${process.env.NODE_ENV} mode on port ${PORT}`
  );
});
