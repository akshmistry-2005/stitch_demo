const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const memberService = require('../services/member.service');
const { success, error, paginated } = require('../utils/response');

const router = express.Router();

// GET /api/members
router.get('/', async (req, res) => {
  try {
    const result = await memberService.list(req.tenantId, req.query);
    return paginated(res, result.members, result.total, result.page, result.limit);
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
});

// POST /api/members
router.post('/', [
  body('fullName').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('phone').optional(),
  body('heightCm').optional().isNumeric().withMessage('Height must be a number'),
  validate
], async (req, res) => {
  try {
    const result = await memberService.create(req.tenantId, req.userId, req.body);
    return success(res, result, 'Member created successfully', 201);
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
});

// GET /api/members/:id
router.get('/:id', async (req, res) => {
  try {
    const result = await memberService.getById(req.tenantId, req.params.id);
    return success(res, result);
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
});

// PUT /api/members/:id
router.put('/:id', async (req, res) => {
  try {
    const result = await memberService.update(req.tenantId, req.params.id, req.body);
    return success(res, result, 'Member updated');
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
});

// DELETE /api/members/:id
router.delete('/:id', async (req, res) => {
  try {
    await memberService.delete(req.tenantId, req.params.id);
    return success(res, null, 'Member deactivated');
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
});

module.exports = router;
