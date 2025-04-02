import "reflect-metadata";
import "./init-di-container";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import compression from "compression";
import path from "path";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { logger } from "@/infra/logger";
import env from "@/infra/env";
import { IHttpErrors } from "@/presentation/http/helpers/IHttpErrors";
import container from "@/infra/di-container";
import { TOKENS } from "@/app/tokens";
import routes from "@/presentation/express/routes";

// Initialize Express app
const app = express();

// Middleware setup
app.use(cookieParser());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS configuration
const allowedOrigins = ["*"];
const corsOptions = {
	origin: (
		origin: string | undefined,
		callback: (err: Error | null, allow?: boolean) => void
	) => {
		/* if (env.isDevelopment) {
			// Allow all origins in non-production environments
			return callback(null, true);
		}

		// Production CORS restrictions
		if (!origin) return callback(null, true); // Allow requests with no origin (like mobile apps or curl requests)

		if (allowedOrigins.indexOf(origin) === -1) {
			const msg =
				"The CORS policy for this site does not allow access from the specified Origin.";
			return callback(new Error(msg), false); // Reject the request
		} */

		callback(null, true);
	},
	credentials: true,
};
app.use(cors(corsOptions));

// Morgan for logging HTTP requests
app.use(morgan("dev"));

// Serve static files
app.use("/static", express.static(path.join(__dirname, "public")));

// API routes using mainRouter
app.use("/api", routes);

// Health check endpoint
app.get("/", (req: Request, res: Response) => {
	res.send("pong");
});

// Catch-all route for handling unknown endpoints
app.use((req: Request, res: Response) => {
	const httpErrors = container.get(TOKENS.HttpErrors) as IHttpErrors;
	const error = httpErrors.error_404();
	res.status(error.statusCode).json({ message: "API not found" });
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
	logger.error(err.stack);
	const httpErrors = container.get(TOKENS.HttpErrors) as IHttpErrors;
	const error = httpErrors.error_500();
	res.status(error.statusCode).json({ message: "Something went wrong!" });
});

export default app;
