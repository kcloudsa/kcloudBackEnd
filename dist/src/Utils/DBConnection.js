"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mongoClientPromise = void 0;
// eslint-disable-next-line import/no-extraneous-dependencies
const mongoose_1 = __importDefault(require("mongoose"));
const mongodb_1 = require("mongodb");
const DBConnection = () => {
    const dbUri = process.env.DB_URI;
    if (!dbUri) {
        throw new Error('DB_URI environment variable is not defined');
    }
    mongoose_1.default
        .connect(dbUri)
        .then((conn) => {
        console.log(`Database connected : ${conn.connection.host}`);
    })
        .catch((err) => {
        console.log(`Database error : ${err.message}`);
        process.exit(1);
    });
};
// MongoClient for Auth.js adapter
let cachedClient = null;
let cachedClientPromise = null;
const mongoClientPromise = () => {
    if (cachedClientPromise) {
        return cachedClientPromise;
    }
    const dbUri = process.env.DB_URI;
    if (!dbUri) {
        throw new Error('DB_URI environment variable is not defined');
    }
    if (!cachedClient) {
        cachedClient = new mongodb_1.MongoClient(dbUri);
    }
    cachedClientPromise = cachedClient.connect();
    return cachedClientPromise;
};
exports.mongoClientPromise = mongoClientPromise;
exports.default = DBConnection;
