"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const envalid_1 = require("envalid");
const env = (0, envalid_1.cleanEnv)(process.env, {
    NODE_ENV: (0, envalid_1.str)({
        choices: ['development', 'test', 'production', 'staging'],
    }),
    PORT: (0, envalid_1.port)(),
    DATABASE_URL: (0, envalid_1.url)(),
    ACCESS_TOKEN_SECRET: (0, envalid_1.str)(),
    REFRESH_TOKEN_SECRET: (0, envalid_1.str)(),
    GOOGLE_CLIENT_SECRET: (0, envalid_1.str)(),
    GOOGLE_CLIENT_ID: (0, envalid_1.str)(),
});
exports.default = env;
