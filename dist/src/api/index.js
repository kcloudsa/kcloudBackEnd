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
const maintenanceAPI_1 = __importDefault(require("./maintenanceAPI"));
const statsAPI_1 = __importDefault(require("./statsAPI"));
const apiKey_1 = __importDefault(require("./apiKey"));
const notificationAPI_1 = __importDefault(require("./notificationAPI"));
const routeSetup_1 = require("../middlewares/routeSetup");
const statusUpdateServices_1 = require("../services/statusUpdateServices");
const autoNotificationServices_1 = require("../services/autoNotificationServices");
const router = express_1.default.Router();
router.get('/', (req, res) => {
    res.json({
        message: 'API - 👋🌎🌍🌏',
    });
});
// Manual status update endpoint
router.post('/update-statuses', async (req, res) => {
    try {
        await (0, statusUpdateServices_1.updateAllStatuses)();
        res.json({
            message: 'Status updates completed successfully',
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        console.error('Manual status update error:', error);
        res.status(500).json({
            error: 'Failed to update statuses',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});
// Manual notification check endpoint
router.post('/check-notifications', async (req, res) => {
    try {
        await (0, autoNotificationServices_1.runNotificationChecks)();
        res.json({
            message: 'Notification checks completed successfully',
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        console.error('Manual notification check error:', error);
        res.status(500).json({
            error: 'Failed to run notification checks',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});
// API routes
router.use('/users', userAPI_1.default);
router.use('/units', unitAPI_1.default);
router.use('/rentals', rentalsAPI_1.default);
router.use('/maintenance', maintenanceAPI_1.default);
router.use('/stats', statsAPI_1.default);
router.use('/notifications', notificationAPI_1.default);
router.use('/apikeys', apiKey_1.default);
router.use('/emojis', emojis_1.default);
// Global error handler for all API routes
router.use(routeSetup_1.routeErrorHandler);
exports.default = router;
