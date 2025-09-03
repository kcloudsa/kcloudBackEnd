"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateAllStatuses = exports.updateMultipleUnitsStatus = exports.updateAllRentalsStatus = exports.updateAllUnitsStatus = exports.updateRentalStatus = exports.updateUnitStatus = void 0;
const mongoose_1 = require("mongoose");
const unitModel_1 = require("../../models/unitModel");
const rentalModel_1 = require("../../models/rentalModel");
const maintenanceRequestModel_1 = require("../../models/maintenanceRequestModel");
const autoNotificationServices_1 = require("../autoNotificationServices");
/**
 * Automatically updates unit status based on active rentals and maintenance requests
 */
const updateUnitStatus = async (unitId) => {
    try {
        const unitObjectId = new mongoose_1.Types.ObjectId(unitId);
        const now = new Date();
        // Check for active maintenance requests
        const activeMaintenance = await maintenanceRequestModel_1.MaintenanceRequestModel.findOne({
            unitID: unitObjectId,
            status: { $in: ['open', 'in_progress', 'pending'] }
        });
        if (activeMaintenance) {
            await unitModel_1.UnitModel.findByIdAndUpdate(unitObjectId, { unitStatus: 'under_maintenance' });
            return 'under_maintenance';
        }
        // Check for active rentals (rentals that are currently ongoing)
        const activeRental = await rentalModel_1.RentalModel.findOne({
            unitID: unitObjectId,
            $or: [
                // Active status rentals
                { rentalStatus: 'active' },
                // Or rentals with current date between start and end
                {
                    startDate: { $lte: now },
                    endDate: { $gte: now },
                    rentalStatus: { $in: ['confirmed', 'checked_in'] }
                }
            ]
        });
        if (activeRental) {
            await unitModel_1.UnitModel.findByIdAndUpdate(unitObjectId, { unitStatus: 'reserved' });
            return 'reserved';
        }
        // Check for future rentals (scheduled)
        const futureRental = await rentalModel_1.RentalModel.findOne({
            unitID: unitObjectId,
            startDate: { $gt: now },
            rentalStatus: { $in: ['scheduled', 'confirmed'] }
        });
        if (futureRental) {
            await unitModel_1.UnitModel.findByIdAndUpdate(unitObjectId, { unitStatus: 'reserved' });
            return 'reserved';
        }
        // If no active rentals or maintenance, unit is available
        const previousUnit = await unitModel_1.UnitModel.findById(unitObjectId);
        const previousStatus = previousUnit?.unitStatus;
        await unitModel_1.UnitModel.findByIdAndUpdate(unitObjectId, { unitStatus: 'available' });
        // Send notification if unit status changed to available
        if (previousStatus !== 'available') {
            // Run notification asynchronously to avoid blocking
            (0, autoNotificationServices_1.notifyUnitAvailable)(unitObjectId).catch(error => console.error('Error sending unit available notification:', error));
        }
        return 'available';
    }
    catch (error) {
        console.error('Error updating unit status:', error);
        throw error;
    }
};
exports.updateUnitStatus = updateUnitStatus;
/**
 * Automatically updates rental status based on dates and current state
 */
const updateRentalStatus = async (rentalId) => {
    try {
        const rentalObjectId = new mongoose_1.Types.ObjectId(rentalId);
        const rental = await rentalModel_1.RentalModel.findById(rentalObjectId);
        if (!rental) {
            throw new Error('Rental not found');
        }
        const now = new Date();
        const startDate = new Date(rental.startDate);
        const endDate = rental.endDate ? new Date(rental.endDate) : null;
        let newStatus = rental.rentalStatus;
        // Don't override manually set statuses like 'cancelled', 'terminated', 'on_hold'
        const manualStatuses = ['cancelled', 'terminated', 'on_hold'];
        if (manualStatuses.includes(rental.rentalStatus)) {
            return rental.rentalStatus;
        }
        // Determine status based on dates
        if (now < startDate) {
            // Future rental
            if (rental.rentalStatus === 'inactive' || rental.rentalStatus === 'pending') {
                newStatus = 'scheduled';
            }
            else if (rental.rentalStatus === 'confirmed') {
                newStatus = 'confirmed';
            }
            else {
                newStatus = 'scheduled';
            }
        }
        else if (endDate && now > endDate) {
            // Past rental
            newStatus = 'completed';
        }
        else {
            // Current rental (between start and end date)
            if (rental.rentalStatus === 'scheduled' || rental.rentalStatus === 'confirmed') {
                newStatus = 'checked_in';
            }
            else if (rental.rentalStatus === 'checked_in') {
                newStatus = 'active';
            }
            else if (rental.rentalStatus === 'pending') {
                newStatus = 'confirmed';
            }
            else {
                newStatus = 'active';
            }
        }
        // For monthly rentals, check if it should be terminated
        if (rental.isMonthly && rental.monthsCount && rental.startDate) {
            const calculatedEndDate = new Date(rental.startDate);
            calculatedEndDate.setMonth(calculatedEndDate.getMonth() + rental.monthsCount);
            if (now > calculatedEndDate) {
                newStatus = 'completed';
            }
        }
        // Update rental status if it changed
        if (newStatus !== rental.rentalStatus) {
            await rentalModel_1.RentalModel.findByIdAndUpdate(rentalObjectId, { rentalStatus: newStatus });
            // Send timeline notifications asynchronously
            (0, autoNotificationServices_1.notifyRentalTimeline)(rentalObjectId).catch(error => console.error('Error sending rental timeline notification:', error));
        }
        return newStatus;
    }
    catch (error) {
        console.error('Error updating rental status:', error);
        throw error;
    }
};
exports.updateRentalStatus = updateRentalStatus;
/**
 * Updates all units statuses for a specific user
 */
const updateAllUnitsStatus = async (userId) => {
    try {
        const userObjectId = new mongoose_1.Types.ObjectId(userId);
        const units = await unitModel_1.UnitModel.find({ userID: userObjectId }).select('_id');
        // Update all units in parallel
        await Promise.all(units.map(unit => (0, exports.updateUnitStatus)(unit._id)));
    }
    catch (error) {
        console.error('Error updating all units status:', error);
        throw error;
    }
};
exports.updateAllUnitsStatus = updateAllUnitsStatus;
/**
 * Updates all rental statuses for a specific user
 */
const updateAllRentalsStatus = async (userId) => {
    try {
        const userObjectId = new mongoose_1.Types.ObjectId(userId);
        const rentals = await rentalModel_1.RentalModel.find({ userID: userObjectId }).select('_id');
        // Update all rentals in parallel
        await Promise.all(rentals.map(rental => (0, exports.updateRentalStatus)(rental._id)));
    }
    catch (error) {
        console.error('Error updating all rentals status:', error);
        throw error;
    }
};
exports.updateAllRentalsStatus = updateAllRentalsStatus;
/**
 * Updates status for multiple units at once
 */
const updateMultipleUnitsStatus = async (unitIds) => {
    try {
        await Promise.all(unitIds.map(unitId => (0, exports.updateUnitStatus)(unitId)));
    }
    catch (error) {
        console.error('Error updating multiple units status:', error);
        throw error;
    }
};
exports.updateMultipleUnitsStatus = updateMultipleUnitsStatus;
/**
 * Scheduled job to update all statuses periodically
 */
const updateAllStatuses = async () => {
    try {
        console.log('Starting automated status update job...');
        // Get all rentals that might need status updates
        const rentals = await rentalModel_1.RentalModel.find({
            rentalStatus: { $nin: ['cancelled', 'terminated'] }
        }).select('_id');
        // Update rental statuses first
        await Promise.all(rentals.map(rental => (0, exports.updateRentalStatus)(rental._id)));
        // Then update all unit statuses
        const units = await unitModel_1.UnitModel.find({}).select('_id');
        await Promise.all(units.map(unit => (0, exports.updateUnitStatus)(unit._id)));
        console.log(`Status update job completed. Updated ${rentals.length} rentals and ${units.length} units.`);
    }
    catch (error) {
        console.error('Error in automated status update job:', error);
    }
};
exports.updateAllStatuses = updateAllStatuses;
