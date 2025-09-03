"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const MaintenanceRequestService_1 = require("../../services/unitServices/MaintenanceRequestService");
const authQuery_1 = require("../../middlewares/authQuery");
// import { enforceUserOwnership } from '../../middlewares/userIsolation';
const router = express_1.default.Router();
// require authentication for all maintenance routes
router.use(authQuery_1.requireAuth);
// List maintenance requests. Admins can see all; users can pass ?unitID=... to filter (ownership enforced in service)
router
    .route('/')
    .get(MaintenanceRequestService_1.getAllMaintenanceRequests)
    .post((req, res, next) => {
    try {
        // Log incoming body for easier debugging of 400 responses
        console.debug('POST /api/v1/maintenance body:', JSON.stringify(req.body));
    }
    catch (e) {
        // ignore logging errors
    }
    return (0, MaintenanceRequestService_1.createMaintenanceRequest)(req, res, next);
})
    .delete(MaintenanceRequestService_1.deleteMaintenanceRequestsBulk);
// Single maintenance request
router
    .route('/:id')
    .get(MaintenanceRequestService_1.getMaintenanceRequestByID)
    .patch(MaintenanceRequestService_1.patchMaintenanceRequest)
    .delete(MaintenanceRequestService_1.deleteMaintenanceRequestByID);
// Delete all maintenance requests for a unit (ownership enforced in service)
router.route('/unit/:unitId').delete(MaintenanceRequestService_1.deleteMaintenanceRequestsByUnitID);
exports.default = router;
