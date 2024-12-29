"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userExists = userExists;
exports.createUser = createUser;
exports.getUserByEmail = getUserByEmail;
exports.getUserById = getUserById;
const prismaClient_1 = __importDefault(require("../prismaClient"));
async function userExists(email) {
    const user = await prismaClient_1.default.user.findFirst({
        where: { email },
        select: { id: true, hashedPassword: true },
    });
    console.log(user);
    if (user?.hashedPassword) {
        return { method: "credential" };
    }
    else if (user) {
        return { method: "google" };
    }
    return null;
}
async function createUser({ email, hashedPassword, firstName, lastName, image, }) {
    const user = await prismaClient_1.default.user.create({
        data: {
            email,
            hashedPassword,
            firstName,
            lastName,
            image,
        },
        select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            image: true,
        },
    });
    return user;
}
async function getUserByEmail(email) {
    const user = await prismaClient_1.default.user.findFirst({
        where: {
            email,
        },
    });
    return user;
}
async function getUserById(id) {
    const user = await prismaClient_1.default.user.findFirst({
        where: {
            id,
        },
    });
    return user;
}
