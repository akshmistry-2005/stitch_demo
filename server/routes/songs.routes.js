const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const songService = require('../services/song.service');
const { success, error } = require('../utils/response');

const router = express.Router();

router.get('/queue', async (req, res) => {
  try {
    const result = await songService.getQueue(req.tenantId);
    return success(res, result);
  } catch (err) { return error(res, err.message, err.status || 500); }
});

router.post('/request', [
  body('songTitle').notEmpty().withMessage('Song title is required'),
  body('requestedBy').notEmpty().withMessage('Requester name is required'),
  validate
], async (req, res) => {
  try {
    const result = await songService.createRequest(req.tenantId, req.body);
    return success(res, result, 'Song request submitted', 201);
  } catch (err) { return error(res, err.message, err.status || 500); }
});

router.put('/:id/status', [
  body('status').isIn(['queued', 'playing', 'played', 'skipped']).withMessage('Invalid status'),
  validate
], async (req, res) => {
  try {
    const result = await songService.updateStatus(req.tenantId, req.params.id, req.body);
    return success(res, result, 'Status updated');
  } catch (err) { return error(res, err.message, err.status || 500); }
});

router.delete('/clear', async (req, res) => {
  try {
    await songService.clearPlayed(req.tenantId);
    return success(res, null, 'Played songs cleared');
  } catch (err) { return error(res, err.message, err.status || 500); }
});

module.exports = router;
