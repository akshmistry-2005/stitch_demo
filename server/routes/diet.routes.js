const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const dietService = require('../services/diet.service');
const { success, error } = require('../utils/response');

const router = express.Router();

// ---- CATEGORIES ----
router.get('/categories', async (req, res) => {
  try {
    const result = await dietService.listCategories(req.tenantId);
    return success(res, result);
  } catch (err) { return error(res, err.message, err.status || 500); }
});

router.post('/categories', [
  body('name').notEmpty().withMessage('Category name is required'),
  validate
], async (req, res) => {
  try {
    const result = await dietService.createCategory(req.tenantId, req.userId, req.body);
    return success(res, result, 'Diet category created', 201);
  } catch (err) { return error(res, err.message, err.status || 500); }
});

router.put('/categories/:id', async (req, res) => {
  try {
    const result = await dietService.updateCategory(req.tenantId, req.params.id, req.body);
    return success(res, result, 'Category updated');
  } catch (err) { return error(res, err.message, err.status || 500); }
});

router.delete('/categories/:id', async (req, res) => {
  try {
    await dietService.deleteCategory(req.tenantId, req.params.id);
    return success(res, null, 'Category deleted');
  } catch (err) { return error(res, err.message, err.status || 500); }
});

// ---- PLANS ----
router.get('/categories/:id/plans', async (req, res) => {
  try {
    const result = await dietService.listPlans(req.tenantId, req.params.id);
    return success(res, result);
  } catch (err) { return error(res, err.message, err.status || 500); }
});

router.post('/plans', [
  body('categoryId').notEmpty().withMessage('Category ID required'),
  body('name').notEmpty().withMessage('Plan name required'),
  validate
], async (req, res) => {
  try {
    const result = await dietService.createPlan(req.tenantId, req.userId, req.body);
    return success(res, result, 'Diet plan created', 201);
  } catch (err) { return error(res, err.message, err.status || 500); }
});

router.put('/plans/:id', async (req, res) => {
  try {
    const result = await dietService.updatePlan(req.tenantId, req.params.id, req.body);
    return success(res, result, 'Plan updated');
  } catch (err) { return error(res, err.message, err.status || 500); }
});

router.delete('/plans/:id', async (req, res) => {
  try {
    await dietService.deletePlan(req.tenantId, req.params.id);
    return success(res, null, 'Plan deleted');
  } catch (err) { return error(res, err.message, err.status || 500); }
});

// ---- MEALS ----
router.get('/plans/:id/meals', async (req, res) => {
  try {
    const result = await dietService.getPlanMeals(req.tenantId, req.params.id);
    return success(res, result);
  } catch (err) { return error(res, err.message, err.status || 500); }
});

router.post('/plans/:id/meals', [
  body('mealName').optional(),
  validate
], async (req, res) => {
  try {
    const result = await dietService.addMeal(req.tenantId, req.params.id, req.body);
    return success(res, result, 'Meal added', 201);
  } catch (err) { return error(res, err.message, err.status || 500); }
});

router.put('/meals/:id', async (req, res) => {
  try {
    const result = await dietService.updateMeal(req.tenantId, req.params.id, req.body);
    return success(res, result, 'Meal updated');
  } catch (err) { return error(res, err.message, err.status || 500); }
});

router.delete('/meals/:id', async (req, res) => {
  try {
    await dietService.deleteMeal(req.tenantId, req.params.id);
    return success(res, null, 'Meal deleted');
  } catch (err) { return error(res, err.message, err.status || 500); }
});

module.exports = router;
