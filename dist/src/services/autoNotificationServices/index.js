"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runNotificationChecks = exports.checkRentalTimelines = exports.notifyMaintenanceCompleted = exports.notifyRentalTimeline = exports.notifyUnitAvailable = void 0;
const mongoose_1 = require("mongoose");
const notificationModel_1 = require("../../models/notificationModel");
const unitModel_1 = require("../../models/unitModel");
const rentalModel_1 = require("../../models/rentalModel");
const maintenanceRequestModel_1 = require("../../models/maintenanceRequestModel");
/**
 * Creates a notification for a user
 */
const createNotification = async (userID, type, title, message) => {
    try {
        let userObjectId;
        if (typeof userID === 'string') {
            userObjectId = new mongoose_1.Types.ObjectId(userID);
        }
        else if (userID instanceof mongoose_1.Types.ObjectId) {
            userObjectId = userID;
        }
        else {
            // Schema.Types.ObjectId
            userObjectId = new mongoose_1.Types.ObjectId(userID.toString());
        }
        // Check for duplicate notifications in the last 10 minutes
        const existingNotification = await notificationModel_1.NotificationModel.findOne({
            userID: userObjectId,
            title,
            message,
            createdAt: {
                $gte: new Date(Date.now() - 10 * 60 * 1000), // Within last 10 minutes
            },
        });
        if (existingNotification) {
            console.log('Duplicate notification prevented:', title);
            return;
        }
        await notificationModel_1.NotificationModel.create({
            userID: userObjectId,
            type,
            title,
            message,
        });
        console.log(`Notification sent to user ${userObjectId}: ${title}`);
    }
    catch (error) {
        console.error('Error creating notification:', error);
    }
};
/**
 * Sends notification when a unit becomes available
 */
const notifyUnitAvailable = async (unitId) => {
    try {
        const unitObjectId = new mongoose_1.Types.ObjectId(unitId);
        const unit = await unitModel_1.UnitModel.findById(unitObjectId).populate('userID');
        if (!unit || !unit.userID) {
            return;
        }
        if (unit.unitStatus === 'available') {
            await createNotification(unit.userID, 'message', 'Unit Available', `Your unit "${unit.number}" is now available for rental!`);
        }
    }
    catch (error) {
        console.error('Error sending unit available notification:', error);
    }
};
exports.notifyUnitAvailable = notifyUnitAvailable;
/**
 * Sends notifications for rental timeline events
 */
const notifyRentalTimeline = async (rentalId) => {
    try {
        const rentalObjectId = new mongoose_1.Types.ObjectId(rentalId);
        const rental = await rentalModel_1.RentalModel.findById(rentalObjectId)
            .populate('userID')
            .populate('unitID');
        if (!rental || !rental.userID) {
            return;
        }
        const now = new Date();
        const startDate = new Date(rental.startDate);
        const calculatedEndDate = new Date(startDate);
        calculatedEndDate.setMonth(calculatedEndDate.getMonth() + rental.monthsCount);
        const timeUntilEnd = calculatedEndDate.getTime() - now.getTime();
        const daysUntilEnd = Math.ceil(timeUntilEnd / (1000 * 60 * 60 * 24));
        const hoursUntilEnd = Math.ceil(timeUntilEnd / (1000 * 60 * 60));
        const unitNumber = rental.unitID?.number || 'Unit';
        // 1 week before (7 days)
        if (daysUntilEnd === 7) {
            await createNotification(rental.userID, 'alert', 'Rental Ending Soon', `Your rental for "${unitNumber}" will end in 1 week (${calculatedEndDate.toLocaleDateString()}). Please plan accordingly.`);
        }
        // 1 day before (24 hours)
        if (daysUntilEnd === 1) {
            await createNotification(rental.userID, 'alert', 'Rental Ending Tomorrow', `Your rental for "${unitNumber}" ends tomorrow (${calculatedEndDate.toLocaleDateString()}). Please prepare for checkout.`);
        }
        // 1 hour before
        if (hoursUntilEnd === 1 && timeUntilEnd > 0) {
            await createNotification(rental.userID, 'danger', 'Rental Ending in 1 Hour', `Your rental for "${unitNumber}" ends in 1 hour. Please complete checkout procedures immediately.`);
        }
        // Rental completed
        if (rental.rentalStatus === 'completed') {
            await createNotification(rental.userID, 'message', 'Rental Completed', `Your rental for "${unitNumber}" has been completed. Thank you for using our service!`);
        }
    }
    catch (error) {
        console.error('Error sending rental timeline notifications:', error);
    }
};
exports.notifyRentalTimeline = notifyRentalTimeline;
/**
 * Sends notification when a maintenance request is closed
 */
const notifyMaintenanceCompleted = async (maintenanceId) => {
    try {
        const maintenanceObjectId = new mongoose_1.Types.ObjectId(maintenanceId);
        const maintenance = await maintenanceRequestModel_1.MaintenanceRequestModel.findById(maintenanceObjectId)
            .populate('userID')
            .populate('unitID');
        if (!maintenance || !maintenance.userID) {
            return;
        }
        if (maintenance.status === 'completed' || maintenance.status === 'closed') {
            const unitNumber = maintenance.unitID?.number || 'Unit';
            await createNotification(maintenance.userID, 'message', 'Maintenance Completed', `Maintenance request for "${unitNumber}" has been completed. Issue: "${maintenance.issueDescription}"`);
        }
    }
    catch (error) {
        console.error('Error sending maintenance completion notification:', error);
    }
};
exports.notifyMaintenanceCompleted = notifyMaintenanceCompleted;
/**
 * Checks all active rentals and sends appropriate timeline notifications
 */
const checkRentalTimelines = async () => {
    try {
        console.log('Checking rental timelines for notifications...');
        const activeRentals = await rentalModel_1.RentalModel.find({
            rentalStatus: { $in: ['active', 'ongoing'] }
        }).select('_id');
        await Promise.all(activeRentals.map(rental => (0, exports.notifyRentalTimeline)(rental._id)));
        console.log(`Checked ${activeRentals.length} active rentals for timeline notifications`);
    }
    catch (error) {
        console.error('Error checking rental timelines:', error);
    }
};
exports.checkRentalTimelines = checkRentalTimelines;
/**
 * Comprehensive notification check for all events
 */
const runNotificationChecks = async () => {
    try {
        console.log('Running comprehensive notification checks...');
        // Check rental timelines
        await (0, exports.checkRentalTimelines)();
        console.log('Notification checks completed successfully');
    }
    catch (error) {
        console.error('Error in notification checks:', error);
    }
};
exports.runNotificationChecks = runNotificationChecks;
