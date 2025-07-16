import express from 'express';
import apiKeyModel from '../../models/apiKeyModel';

const router = express.Router();

// Create new key
router.post('/create', async (req, res) => {
  try {
    const { label } = req.body;

    const key = require('crypto').randomBytes(32).toString('hex');

    const newKey = await apiKeyModel.create({ key, label, active: true });
    res.status(201).json({ key: newKey.key, label: newKey.label });
    return;
  } catch (err) {
    console.log('error', err);
  }
});

// List keys
router.get('/', async (req, res) => {
  const keys = await apiKeyModel.find({}, '-_id key label active createdAt');
  res.json(keys);
});

// Deactivate key
router.patch('/deactivate/:key', async (req, res) => {
  const { key } = req.params;
  await apiKeyModel.updateOne({ key }, { active: false });
  res.json({ message: `Key ${key} deactivated` });
});

// Activate key
router.patch('/activate/:key', async (req, res) => {
  const { key } = req.params;
  await apiKeyModel.updateOne({ key }, { active: true });
  res.json({ message: `Key ${key} activated` });
});

export default router;
