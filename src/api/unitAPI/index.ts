import express from 'express';

import {
  createUnit,
  deleteUnit,
  getUnitById,
  nameUnit,
  updateUnit,
} from '../../services/unitServices';
import {
  createUnitType,
  deleteUnitType,
  getUnitTypeById,
  getUnitTypes,
  updateUnitType,
} from '../../services/unitServices/unitTypeServices';
import {
  createUnitGroup,
  deleteUnitGroup,
  getAllUnitGroups,
  getUnitGroupById,
  updateUnitGroup,
} from '../../services/unitServices/unitGroupServices';

const router = express.Router();

router.route('/').get(nameUnit).post(createUnit);
router.route('/typies').get(getUnitTypes).post(createUnitType);
router.route('/groups').get(getAllUnitGroups).post(createUnitGroup);
router.route('/:id').get(getUnitById).patch(updateUnit).delete(deleteUnit);
router
  .route('/type/:id')
  .get(getUnitTypeById)
  .patch(updateUnitType)
  .delete(deleteUnitType);
router
  .route('/group/:id')
  .get(getUnitGroupById)
  .patch(updateUnitGroup)
  .delete(deleteUnitGroup);

export default router;
