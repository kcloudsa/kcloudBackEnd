"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const unitServices_1 = require("../../services/unitServices");
const unitTypeServices_1 = require("../../services/unitServices/unitTypeServices");
const unitGroupServices_1 = require("../../services/unitServices/unitGroupServices");
const router = express_1.default.Router();
router.route('/').get(unitServices_1.nameUnit).post(unitServices_1.createUnit);
router.route('/typies').get(unitTypeServices_1.getUnitTypes).post(unitTypeServices_1.createUnitType);
router.route('/groups').get(unitGroupServices_1.getAllUnitGroups).post(unitGroupServices_1.createUnitGroup);
router.route('/:id').get(unitServices_1.getUnitById).patch(unitServices_1.updateUnit).delete(unitServices_1.deleteUnit);
router
    .route('/type/:id')
    .get(unitTypeServices_1.getUnitTypeById)
    .patch(unitTypeServices_1.updateUnitType)
    .delete(unitTypeServices_1.deleteUnitType);
router
    .route('/group/:id')
    .get(unitGroupServices_1.getUnitGroupById)
    .patch(unitGroupServices_1.updateUnitGroup)
    .delete(unitGroupServices_1.deleteUnitGroup);
exports.default = router;
