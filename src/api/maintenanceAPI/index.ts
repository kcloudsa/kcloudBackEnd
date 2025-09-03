import express from 'express';
import {
  getAllMaintenanceRequests,
  getMaintenanceRequestByID,
  deleteMaintenanceRequestByID,
  deleteMaintenanceRequestsByUnitID,
  deleteMaintenanceRequestsBulk,
  createMaintenanceRequest,
  patchMaintenanceRequest,
} from '../../services/unitServices/MaintenanceRequestService';
import { requireAuth, } from '../../middlewares/authQuery';
// import { enforceUserOwnership } from '../../middlewares/userIsolation';

const router = express.Router();

// require authentication for all maintenance routes
router.use(requireAuth);

// List maintenance requests. Admins can see all; users can pass ?unitID=... to filter (ownership enforced in service)
router
  .route('/')
  .get(getAllMaintenanceRequests)
  .post((req, res, next) => {
    try {
      // Log incoming body for easier debugging of 400 responses
      console.debug('POST /api/v1/maintenance body:', JSON.stringify(req.body));
    } catch (e) {
      // ignore logging errors
    }
    return createMaintenanceRequest(req, res, next);
  })
  .delete(deleteMaintenanceRequestsBulk);

// Single maintenance request
router
  .route('/:id')
  .get(getMaintenanceRequestByID)
  .patch(patchMaintenanceRequest)
  .delete(deleteMaintenanceRequestByID);

// Delete all maintenance requests for a unit (ownership enforced in service)
router.route('/unit/:unitId').delete(deleteMaintenanceRequestsByUnitID);

export default router;
