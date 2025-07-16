"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const apiKeyModel_1 = __importDefault(require("../../models/apiKeyModel"));
const router = express_1.default.Router();
// Create new key
router.post('/create', async (req, res) => {
    try {
        const { label } = req.body;
        const key = require('crypto').randomBytes(32).toString('hex');
        const newKey = await apiKeyModel_1.default.create({ key, label, active: true });
        res.status(201).json({ key: newKey.key, label: newKey.label });
        return;
    }
    catch (err) {
        console.log('error', err);
    }
});
// List keys
router.get('/', async (req, res) => {
    const keys = await apiKeyModel_1.default.find({}, '-_id key label active createdAt');
    res.json(keys);
});
// Deactivate key
router.patch('/deactivate/:key', async (req, res) => {
    const { key } = req.params;
    await apiKeyModel_1.default.updateOne({ key }, { active: false });
    res.json({ message: `Key ${key} deactivated` });
});
// Activate key
router.patch('/activate/:key', async (req, res) => {
    const { key } = req.params;
    await apiKeyModel_1.default.updateOne({ key }, { active: true });
    res.json({ message: `Key ${key} activated` });
});
exports.default = router;
