const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const eventService = require('../services/event.service');
const upload = require('../middleware/upload');
const { success, error } = require('../utils/response');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const result = await eventService.list(req.tenantId, req.query);
    return success(res, result);
  } catch (err) { return error(res, err.message, err.status || 500); }
});

router.get('/month/:year/:month', async (req, res) => {
  try {
    const result = await eventService.list(req.tenantId, { year: req.params.year, month: req.params.month });
    return success(res, result);
  } catch (err) { return error(res, err.message, err.status || 500); }
});

router.post('/', [
  body('name').notEmpty().withMessage('Event name required'),
  body('eventDate').isDate().withMessage('Valid date required'),
  validate
], async (req, res) => {
  try {
    const result = await eventService.create(req.tenantId, req.userId, req.body);
    return success(res, result, 'Event created', 201);
  } catch (err) { return error(res, err.message, err.status || 500); }
});

router.put('/:id', async (req, res) => {
  try {
    const result = await eventService.update(req.tenantId, req.params.id, req.body);
    return success(res, result, 'Event updated');
  } catch (err) { return error(res, err.message, err.status || 500); }
});

router.delete('/:id', async (req, res) => {
  try {
    await eventService.delete(req.tenantId, req.params.id);
    return success(res, null, 'Event deleted');
  } catch (err) { return error(res, err.message, err.status || 500); }
});

router.put('/:id/competition', async (req, res) => {
  try {
    const result = await eventService.toggleCompetition(req.tenantId, req.params.id);
    return success(res, result, 'Competition status toggled');
  } catch (err) { return error(res, err.message, err.status || 500); }
});

// Photos
router.post('/:id/photos', upload.array('photos', 10), async (req, res) => {
  try {
    const result = await eventService.addPhotos(req.tenantId, req.params.id, req.userId, req.files);
    return success(res, result, 'Photos uploaded', 201);
  } catch (err) { return error(res, err.message, err.status || 500); }
});

router.get('/:id/photos', async (req, res) => {
  try {
    const result = await eventService.getPhotos(req.tenantId, req.params.id);
    return success(res, result);
  } catch (err) { return error(res, err.message, err.status || 500); }
});

// Winners
router.post('/:id/winners', [
  body('winners').isArray({ min: 1 }),
  body('winners.*.position').isIn(['1st', '2nd', '3rd']),
  body('winners.*.winnerName').notEmpty(),
  validate
], async (req, res) => {
  try {
    const result = await eventService.setWinners(req.tenantId, req.params.id, req.body.winners);
    return success(res, result, 'Winners set');
  } catch (err) { return error(res, err.message, err.status || 500); }
});

router.get('/:id/winners', async (req, res) => {
  try {
    const result = await eventService.getWinners(req.tenantId, req.params.id);
    return success(res, result);
  } catch (err) { return error(res, err.message, err.status || 500); }
});

module.exports = router;
