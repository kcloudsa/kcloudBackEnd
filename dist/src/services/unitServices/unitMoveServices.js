"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUnitMove = exports.updateUnitMove = exports.createUnitMove = exports.getUnitMoveById = exports.getUnitMovesByUnitId = exports.getUnitMoves = void 0;
const unitMoveModel_1 = require("../../models/unitMoveModel");
const mongoose_1 = __importDefault(require("mongoose"));
// Get all unit moves for a user
const getUnitMoves = async (req, res) => {
    try {
        const { userID } = req.query;
        if (!userID) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required',
                code: 'USER_ID_REQUIRED'
            });
        }
        if (!mongoose_1.default.Types.ObjectId.isValid(userID)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID format',
                code: 'INVALID_USER_ID'
            });
        }
        const unitMoves = await unitMoveModel_1.UnitMoveModel.find({ userID })
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
    }
    catch (error) {
        console.error('Error fetching unit moves:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch unit moves',
            code: 'FETCH_UNIT_MOVES_ERROR'
        });
    }
};
exports.getUnitMoves = getUnitMoves;
// Get unit moves by unit ID
const getUnitMovesByUnitId = async (req, res) => {
    try {
        const { id } = req.params;
        const { userID } = req.query;
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
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
        if (!mongoose_1.default.Types.ObjectId.isValid(userID)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID format',
                code: 'INVALID_USER_ID'
            });
        }
        const unitMoves = await unitMoveModel_1.UnitMoveModel.find({
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
    }
    catch (error) {
        console.error('Error fetching unit moves by unit ID:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch unit moves for this unit',
            code: 'FETCH_UNIT_MOVES_BY_UNIT_ERROR'
        });
    }
};
exports.getUnitMovesByUnitId = getUnitMovesByUnitId;
// Get a specific unit move by ID
const getUnitMoveById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid unit move ID format',
                code: 'INVALID_UNIT_MOVE_ID'
            });
        }
        const unitMove = await unitMoveModel_1.UnitMoveModel.findById(id)
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
    }
    catch (error) {
        console.error('Error fetching unit move by ID:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch unit move',
            code: 'FETCH_UNIT_MOVE_ERROR'
        });
    }
};
exports.getUnitMoveById = getUnitMoveById;
// Create a new unit move
const createUnitMove = async (req, res) => {
    try {
        const unitMoveData = req.body;
        // Validate required fields
        if (!unitMoveData.unitID || !unitMoveData.moveTypeID || !unitMoveData.moveDate) {
            return res.status(400).json({
                success: false,
                message: 'Unit ID, move type ID, and move date are required',
                code: 'REQUIRED_FIELDS_MISSING'
            });
        }
        const newUnitMove = new unitMoveModel_1.UnitMoveModel(unitMoveData);
        const savedUnitMove = await newUnitMove.save();
        // Populate the created unit move
        const populatedUnitMove = await unitMoveModel_1.UnitMoveModel.findById(savedUnitMove._id)
            .populate('unitID', 'number description')
            .populate('moveTypeID', 'name description')
            .populate('maintenanceID', 'title')
            .populate('rentalID', 'id');
        res.status(201).json({
            success: true,
            data: populatedUnitMove,
            message: 'Unit move created successfully'
        });
    }
    catch (error) {
        console.error('Error creating unit move:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create unit move',
            code: 'CREATE_UNIT_MOVE_ERROR'
        });
    }
};
exports.createUnitMove = createUnitMove;
// Update a unit move
const updateUnitMove = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid unit move ID format',
                code: 'INVALID_UNIT_MOVE_ID'
            });
        }
        const updatedUnitMove = await unitMoveModel_1.UnitMoveModel.findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
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
    }
    catch (error) {
        console.error('Error updating unit move:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update unit move',
            code: 'UPDATE_UNIT_MOVE_ERROR'
        });
    }
};
exports.updateUnitMove = updateUnitMove;
// Delete a unit move
const deleteUnitMove = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid unit move ID format',
                code: 'INVALID_UNIT_MOVE_ID'
            });
        }
        const deletedUnitMove = await unitMoveModel_1.UnitMoveModel.findByIdAndDelete(id);
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
    }
    catch (error) {
        console.error('Error deleting unit move:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete unit move',
            code: 'DELETE_UNIT_MOVE_ERROR'
        });
    }
};
exports.deleteUnitMove = deleteUnitMove;
