const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const staffService = require('../services/staff.service');
const { success, error, paginated } = require('../utils/response');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const result = await staffService.list(req.tenantId, req.query);
    return paginated(res, result.staff, result.total, result.page, result.limit);
  } catch (err) { return error(res, err.message, err.status || 500); }
});

router.post('/', [
  body('fullName').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  validate
], async (req, res) => {
  try {
    const result = await staffService.create(req.tenantId, req.userId, req.body);
    return success(res, result, 'Staff member created', 201);
  } catch (err) { return error(res, err.message, err.status || 500); }
});

router.put('/:id', async (req, res) => {
  try {
    const result = await staffService.update(req.tenantId, req.params.id, req.body);
    return success(res, result, 'Staff updated');
  } catch (err) { return error(res, err.message, err.status || 500); }
});

router.delete('/:id', async (req, res) => {
  try {
    await staffService.delete(req.tenantId, req.params.id);
    return success(res, null, 'Staff deactivated');
  } catch (err) { return error(res, err.message, err.status || 500); }
});

module.exports = router;
