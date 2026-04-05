const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const workoutService = require('../services/workout.service');
const { success, error } = require('../utils/response');

const router = express.Router();

// ---- CATEGORIES ----
router.get('/categories', async (req, res) => {
  try {
    const result = await workoutService.listCategories(req.tenantId);
    return success(res, result);
  } catch (err) { return error(res, err.message, err.status || 500); }
});

router.post('/categories', [
  body('name').notEmpty().withMessage('Category name is required'),
  validate
], async (req, res) => {
  try {
    const result = await workoutService.createCategory(req.tenantId, req.userId, req.body);
    return success(res, result, 'Category created', 201);
  } catch (err) { return error(res, err.message, err.status || 500); }
});

router.put('/categories/:id', async (req, res) => {
  try {
    const result = await workoutService.updateCategory(req.tenantId, req.params.id, req.body);
    return success(res, result, 'Category updated');
  } catch (err) { return error(res, err.message, err.status || 500); }
});

router.delete('/categories/:id', async (req, res) => {
  try {
    await workoutService.deleteCategory(req.tenantId, req.params.id);
    return success(res, null, 'Category deleted');
  } catch (err) { return error(res, err.message, err.status || 500); }
});

// ---- EXERCISES ----
router.get('/categories/:id/exercises', async (req, res) => {
  try {
    const result = await workoutService.getExercises(req.tenantId, req.params.id);
    return success(res, result);
  } catch (err) { return error(res, err.message, err.status || 500); }
});

router.post('/categories/:id/exercises', [
  body('exercises').isArray({ min: 1 }).withMessage('At least one exercise required'),
  body('exercises.*.exerciseName').notEmpty().withMessage('Exercise name is required'),
  body('exercises.*.sets').isInt({ min: 1 }).withMessage('Please enter number of sets'),
  body('exercises.*.repetitions').isInt({ min: 1 }).withMessage('Please enter number of repetitions'),
  validate
], async (req, res) => {
  try {
    const result = await workoutService.addExercises(req.tenantId, req.params.id, req.body.exercises);
    return success(res, result, 'Exercises saved', 201);
  } catch (err) { return error(res, err.message, err.status || 500); }
});

router.put('/exercises/:id', async (req, res) => {
  try {
    const result = await workoutService.updateExercise(req.tenantId, req.params.id, req.body);
    return success(res, result, 'Exercise updated');
  } catch (err) { return error(res, err.message, err.status || 500); }
});

router.delete('/exercises/:id', async (req, res) => {
  try {
    await workoutService.deleteExercise(req.tenantId, req.params.id);
    return success(res, null, 'Exercise deleted');
  } catch (err) { return error(res, err.message, err.status || 500); }
});

module.exports = router;
