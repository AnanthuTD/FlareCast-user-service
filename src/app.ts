import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import compression from "compression";
import path from "path";
import morgan from "morgan";
import passport from "passport";
import cookieParser from "cookie-parser";
import "./authentication/LocalStrategy";
import "./authentication/JwtStrategy";
import env from "./env";
import routes from "./routes";
import dependencies from "./config/dependencies";
import { logger } from "./logger/logger";

const app = express();

app.use(cookieParser());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const allowedOrigins = ["*"];

// CORS options
const corsOptions = {
	origin: (origin, callback) => {
		if (env.isDevelopment) {
			// Allow all origins in non-production environments
			return callback(null, true);
		}

		// Production CORS restrictions
		if (!origin) return callback(null, true); // Allow requests with no origin (like mobile apps or curl requests)

		if (allowedOrigins.indexOf(origin) === -1) {
			const msg =
				"The CORS policy for this site does not allow access from the specified Origin.";
			return callback(new Error(msg), false); // Reject the request
		}

		callback(null, true);
	},
	credentials: true,
};

app.use(cors(corsOptions));
app.use(morgan("dev"));
app.use("/static", express.static(path.join(__dirname, "public")));
app.use(passport.initialize());

// API endpoint
app.use("/api", routes(dependencies));
app.use("/", (req, res) => {
	res.send("pong");
});

// Catch-all route for handling unknown endpoints
app.use((req, res) => {
	res.status(404).send({ message: "API not found" });
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
	logger.error(err.stack);
	res.status(500).send("Something went wrong!");
});

export default app;
