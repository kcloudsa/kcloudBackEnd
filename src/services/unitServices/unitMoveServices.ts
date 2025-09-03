import { Request, Response } from 'express';
import { UnitMoveModel } from '../../models/unitMoveModel';
import { IunitMove } from '../../interfaces/IunitMove';
import mongoose from 'mongoose';

// Get all unit moves for a user
export const getUnitMoves = async (req: Request, res: Response) => {
  try {
    const { userID } = req.query;

    if (!userID) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required',
        code: 'USER_ID_REQUIRED'
      });
    }

    if (!mongoose.Types.ObjectId.isValid(userID as string)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format',
        code: 'INVALID_USER_ID'
      });
    }

    const unitMoves = await UnitMoveModel.find({ userID })
      .populate('unitID', 'number description')
      .populate('moveTypeID', 'name description')
      .populate('maintenanceID', 'title')
      .populate('rentalID', 'id')
      .sort({ moveDate: -1 });

    res.status(200).json({
      success: true,
      data: unitMoves,
      count: unitMoves.length
    });
  } catch (error) {
    console.error('Error fetching unit moves:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch unit moves',
      code: 'FETCH_UNIT_MOVES_ERROR'
    });
  }
};

// Get unit moves by unit ID
export const getUnitMovesByUnitId = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { userID } = req.query;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid unit ID format',
        code: 'INVALID_UNIT_ID'
      });
    }

    if (!userID) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required',
        code: 'USER_ID_REQUIRED'
      });
    }

    if (!mongoose.Types.ObjectId.isValid(userID as string)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format',
        code: 'INVALID_USER_ID'
      });
    }

    const unitMoves = await UnitMoveModel.find({ 
      unitID: id, 
      userID 
    })
      .populate('unitID', 'number description')
      .populate('moveTypeID', 'name description')
      .populate('maintenanceID', 'title')
      .populate('rentalID', 'id')
      .sort({ moveDate: -1 });

    res.status(200).json({
      success: true,
      data: unitMoves,
      count: unitMoves.length
    });
  } catch (error) {
    console.error('Error fetching unit moves by unit ID:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch unit moves for this unit',
      code: 'FETCH_UNIT_MOVES_BY_UNIT_ERROR'
    });
  }
};

// Get a specific unit move by ID
export const getUnitMoveById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid unit move ID format',
        code: 'INVALID_UNIT_MOVE_ID'
      });
    }

    const unitMove = await UnitMoveModel.findById(id)
      .populate('unitID', 'number description')
      .populate('moveTypeID', 'name description')
      .populate('maintenanceID', 'title')
      .populate('rentalID', 'id');

    if (!unitMove) {
      return res.status(404).json({
        success: false,
        message: 'Unit move not found',
        code: 'UNIT_MOVE_NOT_FOUND'
      });
    }

    res.status(200).json({
      success: true,
      data: unitMove
    });
  } catch (error) {
    console.error('Error fetching unit move by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch unit move',
      code: 'FETCH_UNIT_MOVE_ERROR'
    });
  }
};

// Create a new unit move
export const createUnitMove = async (req: Request, res: Response) => {
  try {
    const unitMoveData: Partial<IunitMove> = req.body;

    // Validate required fields
    if (!unitMoveData.unitID || !unitMoveData.moveTypeID || !unitMoveData.moveDate) {
      return res.status(400).json({
        success: false,
        message: 'Unit ID, move type ID, and move date are required',
        code: 'REQUIRED_FIELDS_MISSING'
      });
    }

    const newUnitMove = new UnitMoveModel(unitMoveData);
    const savedUnitMove = await newUnitMove.save();

    // Populate the created unit move
    const populatedUnitMove = await UnitMoveModel.findById(savedUnitMove._id)
      .populate('unitID', 'number description')
      .populate('moveTypeID', 'name description')
      .populate('maintenanceID', 'title')
      .populate('rentalID', 'id');

    res.status(201).json({
      success: true,
      data: populatedUnitMove,
      message: 'Unit move created successfully'
    });
  } catch (error) {
    console.error('Error creating unit move:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create unit move',
      code: 'CREATE_UNIT_MOVE_ERROR'
    });
  }
};

// Update a unit move
export const updateUnitMove = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData: Partial<IunitMove> = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid unit move ID format',
        code: 'INVALID_UNIT_MOVE_ID'
      });
    }

    const updatedUnitMove = await UnitMoveModel.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('unitID', 'number description')
      .populate('moveTypeID', 'name description')
      .populate('maintenanceID', 'title')
      .populate('rentalID', 'id');

    if (!updatedUnitMove) {
      return res.status(404).json({
        success: false,
        message: 'Unit move not found',
        code: 'UNIT_MOVE_NOT_FOUND'
      });
    }

    res.status(200).json({
      success: true,
      data: updatedUnitMove,
      message: 'Unit move updated successfully'
    });
  } catch (error) {
    console.error('Error updating unit move:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update unit move',
      code: 'UPDATE_UNIT_MOVE_ERROR'
    });
  }
};

// Delete a unit move
export const deleteUnitMove = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid unit move ID format',
        code: 'INVALID_UNIT_MOVE_ID'
      });
    }

    const deletedUnitMove = await UnitMoveModel.findByIdAndDelete(id);

    if (!deletedUnitMove) {
      return res.status(404).json({
        success: false,
        message: 'Unit move not found',
        code: 'UNIT_MOVE_NOT_FOUND'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Unit move deleted successfully',
      data: { id }
    });
  } catch (error) {
    console.error('Error deleting unit move:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete unit move',
      code: 'DELETE_UNIT_MOVE_ERROR'
    });
  }
};
