const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const trainerService = require('../services/trainer.service');
const { success, error } = require('../utils/response');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const result = await trainerService.list(req.tenantId);
    return success(res, result);
  } catch (err) { return error(res, err.message, err.status || 500); }
});

router.post('/', [
  body('fullName').notEmpty().withMessage('Trainer name is required'),
  validate
], async (req, res) => {
  try {
    const result = await trainerService.create(req.tenantId, req.userId, req.body);
    return success(res, result, 'Trainer added', 201);
  } catch (err) { return error(res, err.message, err.status || 500); }
});

router.put('/:id', async (req, res) => {
  try {
    const result = await trainerService.update(req.tenantId, req.params.id, req.body);
    return success(res, result, 'Trainer updated');
  } catch (err) { return error(res, err.message, err.status || 500); }
});

router.delete('/:id', async (req, res) => {
  try {
    await trainerService.delete(req.tenantId, req.params.id);
    return success(res, null, 'Trainer removed');
  } catch (err) { return error(res, err.message, err.status || 500); }
});

// Assign trainer to member
router.post('/assign', [
  body('trainerId').notEmpty().withMessage('Trainer ID required'),
  body('memberId').notEmpty().withMessage('Member ID required'),
  validate
], async (req, res) => {
  try {
    const result = await trainerService.assignTrainer(req.tenantId, req.userId, req.body);
    return success(res, result, 'Trainer assigned', 201);
  } catch (err) { return error(res, err.message, err.status || 500); }
});

// Unassign trainer from member
router.delete('/assign/:memberId', async (req, res) => {
  try {
    await trainerService.unassignTrainer(req.tenantId, req.params.memberId);
    return success(res, null, 'Trainer unassigned');
  } catch (err) { return error(res, err.message, err.status || 500); }
});

// Get trainer's assigned members
router.get('/:id/members', async (req, res) => {
  try {
    const result = await trainerService.getTrainerMembers(req.tenantId, req.params.id);
    return success(res, result);
  } catch (err) { return error(res, err.message, err.status || 500); }
});

module.exports = router;
