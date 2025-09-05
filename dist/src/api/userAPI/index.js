"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const userServices_1 = require("../../services/userServices");
const authQuery_1 = require("../../middlewares/authQuery");
const userIsolation_1 = require("../../middlewares/userIsolation");
const router = express_1.default.Router();
// User listing (admin only or for user management)
router
    .route('/')
    .get(authQuery_1.requireAuth, (0, userIsolation_1.validateAuthQueryWithUserIsolation)({
    allowCrossUserAccess: true, // Only admins should access all users
    maxLimit: 100,
    allowedSortFields: [
        'createdAt',
        'updatedAt',
        'userName.firstName',
        'userName.lastName',
    ],
    allowedPopulateFields: [],
    userField: '_id',
}), userServices_1.allUsers)
    .post(userServices_1.createUser); // No auth required for signup, very low rate limit
// Individual user operations with strict ownership enforcement
router
    .route('/:id')
    .get(authQuery_1.requireAuth, (0, userIsolation_1.enforceUserOwnership)('user'), // Users can only access their own profile
userServices_1.getUserById)
    .patch(authQuery_1.requireAuth, (0, userIsolation_1.enforceUserOwnership)('user'), // Users can only update their own profile
userServices_1.updateUser)
    .delete(authQuery_1.requireAuth, (0, userIsolation_1.enforceUserOwnership)('user'), // Users can only delete their own profile
userServices_1.deleteUser);
// Change password
router.post('/:id/password', authQuery_1.requireAuth, (0, userIsolation_1.enforceUserOwnership)('user'), userServices_1.changePassword);
exports.default = router;
