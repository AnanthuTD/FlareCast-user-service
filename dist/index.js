"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const env_1 = __importDefault(require("./env"));
const start = async () => {
    try {
        app_1.default.listen(env_1.default.PORT, () => {
            console.info(`Server running at http://localhost:${env_1.default.PORT}`);
        });
    }
    catch (err) {
        console.error(`Error starting the server: ${err.message}`);
    }
};
start();
