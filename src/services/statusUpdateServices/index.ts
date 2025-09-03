import { Types } from 'mongoose';
import { UnitModel } from '../../models/unitModel';
import { RentalModel } from '../../models/rentalModel';
import { MaintenanceRequestModel } from '../../models/maintenanceRequestModel';
import { notifyUnitAvailable, notifyRentalTimeline } from '../autoNotificationServices';

/**
 * Automatically updates unit status based on active rentals and maintenance requests
 */
export const updateUnitStatus = async (unitId: Types.ObjectId | string): Promise<string> => {
  try {
    const unitObjectId = new Types.ObjectId(unitId);
    const now = new Date();

    // Check for active maintenance requests
    const activeMaintenance = await MaintenanceRequestModel.findOne({
      unitID: unitObjectId,
      status: { $in: ['open', 'in_progress', 'pending'] }
    });

    if (activeMaintenance) {
      await UnitModel.findByIdAndUpdate(unitObjectId, { unitStatus: 'under_maintenance' });
      return 'under_maintenance';
    }

    // Check for active rentals (rentals that are currently ongoing)
    const activeRental = await RentalModel.findOne({
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
      await UnitModel.findByIdAndUpdate(unitObjectId, { unitStatus: 'reserved' });
      return 'reserved';
    }

    // Check for future rentals (scheduled)
    const futureRental = await RentalModel.findOne({
      unitID: unitObjectId,
      startDate: { $gt: now },
      rentalStatus: { $in: ['scheduled', 'confirmed'] }
    });

    if (futureRental) {
      await UnitModel.findByIdAndUpdate(unitObjectId, { unitStatus: 'reserved' });
      return 'reserved';
    }

    // If no active rentals or maintenance, unit is available
    const previousUnit = await UnitModel.findById(unitObjectId);
    const previousStatus = previousUnit?.unitStatus;
    
    await UnitModel.findByIdAndUpdate(unitObjectId, { unitStatus: 'available' });
    
    // Send notification if unit status changed to available
    if (previousStatus !== 'available') {
      // Run notification asynchronously to avoid blocking
      notifyUnitAvailable(unitObjectId).catch(error => 
        console.error('Error sending unit available notification:', error)
      );
    }
    
    return 'available';

  } catch (error) {
    console.error('Error updating unit status:', error);
    throw error;
  }
};

/**
 * Automatically updates rental status based on dates and current state
 */
export const updateRentalStatus = async (rentalId: Types.ObjectId | string): Promise<string> => {
  try {
    const rentalObjectId = new Types.ObjectId(rentalId);
    const rental = await RentalModel.findById(rentalObjectId);
    
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
      } else if (rental.rentalStatus === 'confirmed') {
        newStatus = 'confirmed';
      } else {
        newStatus = 'scheduled';
      }
    } else if (endDate && now > endDate) {
      // Past rental
      newStatus = 'completed';
    } else {
      // Current rental (between start and end date)
      if (rental.rentalStatus === 'scheduled' || rental.rentalStatus === 'confirmed') {
        newStatus = 'checked_in';
      } else if (rental.rentalStatus === 'checked_in') {
        newStatus = 'active';
      } else if (rental.rentalStatus === 'pending') {
        newStatus = 'confirmed';
      } else {
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
      await RentalModel.findByIdAndUpdate(rentalObjectId, { rentalStatus: newStatus });
      
      // Send timeline notifications asynchronously
      notifyRentalTimeline(rentalObjectId).catch(error => 
        console.error('Error sending rental timeline notification:', error)
      );
    }

    return newStatus;

  } catch (error) {
    console.error('Error updating rental status:', error);
    throw error;
  }
};

/**
 * Updates all units statuses for a specific user
 */
export const updateAllUnitsStatus = async (userId: Types.ObjectId | string): Promise<void> => {
  try {
    const userObjectId = new Types.ObjectId(userId);
    const units = await UnitModel.find({ userID: userObjectId }).select('_id');
    
    // Update all units in parallel
    await Promise.all(
      units.map(unit => updateUnitStatus(unit._id as Types.ObjectId))
    );
  } catch (error) {
    console.error('Error updating all units status:', error);
    throw error;
  }
};

/**
 * Updates all rental statuses for a specific user
 */
export const updateAllRentalsStatus = async (userId: Types.ObjectId | string): Promise<void> => {
  try {
    const userObjectId = new Types.ObjectId(userId);
    const rentals = await RentalModel.find({ userID: userObjectId }).select('_id');
    
    // Update all rentals in parallel
    await Promise.all(
      rentals.map(rental => updateRentalStatus(rental._id as Types.ObjectId))
    );
  } catch (error) {
    console.error('Error updating all rentals status:', error);
    throw error;
  }
};

/**
 * Updates status for multiple units at once
 */
export const updateMultipleUnitsStatus = async (unitIds: (Types.ObjectId | string)[]): Promise<void> => {
  try {
    await Promise.all(
      unitIds.map(unitId => updateUnitStatus(unitId))
    );
  } catch (error) {
    console.error('Error updating multiple units status:', error);
    throw error;
  }
};

/**
 * Scheduled job to update all statuses periodically
 */
export const updateAllStatuses = async (): Promise<void> => {
  try {
    console.log('Starting automated status update job...');
    
    // Get all rentals that might need status updates
    const rentals = await RentalModel.find({
      rentalStatus: { $nin: ['cancelled', 'terminated'] }
    }).select('_id');
    
    // Update rental statuses first
    await Promise.all(
      rentals.map(rental => updateRentalStatus(rental._id as Types.ObjectId))
    );
    
    // Then update all unit statuses
    const units = await UnitModel.find({}).select('_id');
    await Promise.all(
      units.map(unit => updateUnitStatus(unit._id as Types.ObjectId))
    );
    
    console.log(`Status update job completed. Updated ${rentals.length} rentals and ${units.length} units.`);
  } catch (error) {
    console.error('Error in automated status update job:', error);
  }
};
