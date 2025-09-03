import { Types, Schema } from 'mongoose';
import { NotificationModel } from '../../models/notificationModel';
import { UnitModel } from '../../models/unitModel';
import { RentalModel } from '../../models/rentalModel';
import { MaintenanceRequestModel } from '../../models/maintenanceRequestModel';

/**
 * Creates a notification for a user
 */
const createNotification = async (
  userID: Types.ObjectId | Schema.Types.ObjectId | string,
  type: 'message' | 'alert' | 'danger',
  title: string,
  message: string
): Promise<void> => {
  try {
    let userObjectId: Types.ObjectId;
    
    if (typeof userID === 'string') {
      userObjectId = new Types.ObjectId(userID);
    } else if (userID instanceof Types.ObjectId) {
      userObjectId = userID;
    } else {
      // Schema.Types.ObjectId
      userObjectId = new Types.ObjectId(userID.toString());
    }
    
    // Check for duplicate notifications in the last 10 minutes
    const existingNotification = await NotificationModel.findOne({
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

    await NotificationModel.create({
      userID: userObjectId,
      type,
      title,
      message,
    });

    console.log(`Notification sent to user ${userObjectId}: ${title}`);
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};

/**
 * Sends notification when a unit becomes available
 */
export const notifyUnitAvailable = async (unitId: Types.ObjectId | string): Promise<void> => {
  try {
    const unitObjectId = new Types.ObjectId(unitId);
    const unit = await UnitModel.findById(unitObjectId).populate('userID');
    
    if (!unit || !unit.userID) {
      return;
    }

    if (unit.unitStatus === 'available') {
      await createNotification(
        unit.userID,
        'message',
        'Unit Available',
        `Your unit "${unit.number}" is now available for rental!`
      );
    }
  } catch (error) {
    console.error('Error sending unit available notification:', error);
  }
};

/**
 * Sends notifications for rental timeline events
 */
export const notifyRentalTimeline = async (rentalId: Types.ObjectId | string): Promise<void> => {
  try {
    const rentalObjectId = new Types.ObjectId(rentalId);
    const rental = await RentalModel.findById(rentalObjectId)
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
    
    const unitNumber = (rental.unitID as any)?.number || 'Unit';

    // 1 week before (7 days)
    if (daysUntilEnd === 7) {
      await createNotification(
        rental.userID,
        'alert',
        'Rental Ending Soon',
        `Your rental for "${unitNumber}" will end in 1 week (${calculatedEndDate.toLocaleDateString()}). Please plan accordingly.`
      );
    }
    
    // 1 day before (24 hours)
    if (daysUntilEnd === 1) {
      await createNotification(
        rental.userID,
        'alert',
        'Rental Ending Tomorrow',
        `Your rental for "${unitNumber}" ends tomorrow (${calculatedEndDate.toLocaleDateString()}). Please prepare for checkout.`
      );
    }
    
    // 1 hour before
    if (hoursUntilEnd === 1 && timeUntilEnd > 0) {
      await createNotification(
        rental.userID,
        'danger',
        'Rental Ending in 1 Hour',
        `Your rental for "${unitNumber}" ends in 1 hour. Please complete checkout procedures immediately.`
      );
    }
    
    // Rental completed
    if (rental.rentalStatus === 'completed') {
      await createNotification(
        rental.userID,
        'message',
        'Rental Completed',
        `Your rental for "${unitNumber}" has been completed. Thank you for using our service!`
      );
    }
  } catch (error) {
    console.error('Error sending rental timeline notifications:', error);
  }
};

/**
 * Sends notification when a maintenance request is closed
 */
export const notifyMaintenanceCompleted = async (maintenanceId: Types.ObjectId | string): Promise<void> => {
  try {
    const maintenanceObjectId = new Types.ObjectId(maintenanceId);
    const maintenance = await MaintenanceRequestModel.findById(maintenanceObjectId)
      .populate('userID')
      .populate('unitID');
    
    if (!maintenance || !maintenance.userID) {
      return;
    }

    if (maintenance.status === 'completed' || maintenance.status === 'closed') {
      const unitNumber = (maintenance.unitID as any)?.number || 'Unit';
      
      await createNotification(
        maintenance.userID,
        'message',
        'Maintenance Completed',
        `Maintenance request for "${unitNumber}" has been completed. Issue: "${maintenance.issueDescription}"`
      );
    }
  } catch (error) {
    console.error('Error sending maintenance completion notification:', error);
  }
};

/**
 * Checks all active rentals and sends appropriate timeline notifications
 */
export const checkRentalTimelines = async (): Promise<void> => {
  try {
    console.log('Checking rental timelines for notifications...');
    
    const activeRentals = await RentalModel.find({
      rentalStatus: { $in: ['active', 'ongoing'] }
    }).select('_id');

    await Promise.all(
      activeRentals.map(rental => notifyRentalTimeline((rental as any)._id))
    );

    console.log(`Checked ${activeRentals.length} active rentals for timeline notifications`);
  } catch (error) {
    console.error('Error checking rental timelines:', error);
  }
};

/**
 * Comprehensive notification check for all events
 */
export const runNotificationChecks = async (): Promise<void> => {
  try {
    console.log('Running comprehensive notification checks...');
    
    // Check rental timelines
    await checkRentalTimelines();
    
    console.log('Notification checks completed successfully');
  } catch (error) {
    console.error('Error in notification checks:', error);
  }
};
