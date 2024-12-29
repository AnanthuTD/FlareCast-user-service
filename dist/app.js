"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const compression_1 = __importDefault(require("compression"));
const path_1 = __importDefault(require("path"));
const morgan_1 = __importDefault(require("morgan"));
const passport_1 = __importDefault(require("passport"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
require("./authentication/LocalStrategy");
require("./authentication/JwtStrategy");
const env_1 = __importDefault(require("./env"));
const routes_1 = __importDefault(require("./routes"));
const app = (0, express_1.default)();
app.use((0, cookie_parser_1.default)());
app.use((0, compression_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
const allowedOrigins = [
    '*'
];
// CORS options
const corsOptions = {
    origin: (origin, callback) => {
        if (env_1.default.isDevelopment) {
            // Allow all origins in non-production environments
            return callback(null, true);
        }
        // Production CORS restrictions
        if (!origin)
            return callback(null, true); // Allow requests with no origin (like mobile apps or curl requests)
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false); // Reject the request
        }
        callback(null, true);
    },
    credentials: true,
};
app.use((0, cors_1.default)(corsOptions));
app.use((0, morgan_1.default)('dev'));
app.use('/static', express_1.default.static(path_1.default.join(__dirname, 'public')));
app.use(passport_1.default.initialize());
// API endpoint
app.use('/api', routes_1.default);
// Catch-all route for handling unknown endpoints
app.use((req, res) => {
    res.status(404).send({ message: 'API not found' });
});
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err, req, res, _next) => {
    console.error(err.stack);
    res.status(500).send('Something went wrong!');
});
exports.default = app;
