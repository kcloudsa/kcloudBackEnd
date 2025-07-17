"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const emojis_1 = __importDefault(require("./emojis"));
const userAPI_1 = __importDefault(require("./userAPI"));
const unitAPI_1 = __importDefault(require("./unitAPI"));
const rentalsAPI_1 = __importDefault(require("./rentalsAPI"));
const apiKey_1 = __importDefault(require("./apiKey"));
const validationBody_1 = require("../middlewares/validationBody");
const router = express_1.default.Router();
router.get('/', (req, res) => {
    res.json({
        message: 'API - 👋🌎🌍🌏',
    });
});
//user route
router.use('/users', userAPI_1.default);
router.use('/units', (0, validationBody_1.validateBody)(), unitAPI_1.default);
router.use('/rentals', rentalsAPI_1.default);
router.use('/apikeys', apiKey_1.default);
router.use('/emojis', emojis_1.default);
exports.default = router;
