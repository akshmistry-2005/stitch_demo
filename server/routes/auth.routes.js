const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const authService = require('../services/auth.service');
const authMiddleware = require('../middleware/auth');
const { success, error } = require('../utils/response');

const router = express.Router();

// POST /api/auth/signup
router.post('/signup', [
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('fullName').notEmpty().withMessage('Full name is required'),
  body('gymName').notEmpty().withMessage('Gym name is required'),
  validate
], async (req, res) => {
  try {
    const result = await authService.signup(req.body);
    return success(res, result, 'Account created successfully', 201);
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
});

// POST /api/auth/login
router.post('/login', [
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password').notEmpty().withMessage('Password is required'),
  validate
], async (req, res) => {
  try {
    const result = await authService.login(req.body);
    return success(res, result, 'Login successful');
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
});

// POST /api/auth/google
router.post('/google', [
  body('googleId').notEmpty(),
  body('email').isEmail(),
  body('fullName').notEmpty(),
  validate
], async (req, res) => {
  try {
    const result = await authService.googleAuth(req.body);
    return success(res, result, 'Google authentication successful');
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
});

// POST /api/auth/refresh
router.post('/refresh', [
  body('refreshToken').notEmpty(),
  validate
], async (req, res) => {
  try {
    const tokens = await authService.refreshToken(req.body.refreshToken);
    return success(res, tokens, 'Token refreshed');
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
});

// GET /api/auth/me
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const profile = await authService.getProfile(req.userId, req.tenantId);
    return success(res, profile);
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
});

module.exports = router;
