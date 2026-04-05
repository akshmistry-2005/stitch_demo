const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');

class DietService {
  // ---- CATEGORIES ----
  async listCategories(tenantId) {
    const [rows] = await db.query(
      `SELECT dc.*, COUNT(dp.id) as plan_count
       FROM diet_categories dc
       LEFT JOIN diet_plans dp ON dc.id = dp.category_id
       WHERE dc.tenant_id = ?
       GROUP BY dc.id ORDER BY dc.created_at DESC`,
      [tenantId]
    );
    return rows;
  }

  async createCategory(tenantId, userId, { name, description }) {
    const id = uuidv4();
    await db.query(
      'INSERT INTO diet_categories (id, tenant_id, name, description, created_by) VALUES (?, ?, ?, ?, ?)',
      [id, tenantId, name, description || null, userId]
    );
    return { id, name, description, planCount: 0 };
  }

  async updateCategory(tenantId, categoryId, data) {
    const fields = [];
    const params = [];
    if (data.name) { fields.push('name = ?'); params.push(data.name); }
    if (data.description !== undefined) { fields.push('description = ?'); params.push(data.description); }
    if (fields.length === 0) throw { status: 400, message: 'No fields to update' };
    params.push(categoryId, tenantId);
    await db.query(`UPDATE diet_categories SET ${fields.join(', ')} WHERE id = ? AND tenant_id = ?`, params);
    const [rows] = await db.query('SELECT * FROM diet_categories WHERE id = ? AND tenant_id = ?', [categoryId, tenantId]);
    return rows[0];
  }

  async deleteCategory(tenantId, categoryId) {
    await db.query('DELETE FROM diet_categories WHERE id = ? AND tenant_id = ?', [categoryId, tenantId]);
  }

  // ---- PLANS ----
  async listPlans(tenantId, categoryId) {
    const [rows] = await db.query(
      `SELECT dp.*, COUNT(dm.id) as meal_count
       FROM diet_plans dp
       LEFT JOIN diet_meals dm ON dp.id = dm.plan_id
       WHERE dp.category_id = ? AND dp.tenant_id = ?
       GROUP BY dp.id ORDER BY dp.created_at DESC`,
      [categoryId, tenantId]
    );
    return rows;
  }

  async createPlan(tenantId, userId, { categoryId, name, meals }) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      // Verify category
      const [cat] = await conn.query('SELECT id FROM diet_categories WHERE id = ? AND tenant_id = ?', [categoryId, tenantId]);
      if (cat.length === 0) throw { status: 404, message: 'Diet category not found' };

      const planId = uuidv4();
      await conn.query(
        'INSERT INTO diet_plans (id, category_id, tenant_id, name, created_by) VALUES (?, ?, ?, ?, ?)',
        [planId, categoryId, tenantId, name, userId]
      );

      const savedMeals = [];
      if (meals && meals.length > 0) {
        for (let i = 0; i < meals.length; i++) {
          const meal = meals[i];
          const mealId = uuidv4();
          await conn.query(
            'INSERT INTO diet_meals (id, plan_id, tenant_id, meal_name, meal_time, food_details, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [mealId, planId, tenantId, meal.mealName || `Meal ${i + 1}`, meal.mealTime || null, meal.foodDetails || null, i]
          );
          savedMeals.push({ id: mealId, mealName: meal.mealName, mealTime: meal.mealTime, foodDetails: meal.foodDetails });
        }
      }

      await conn.commit();
      return { id: planId, name, categoryId, meals: savedMeals };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  async updatePlan(tenantId, planId, data) {
    if (data.name) {
      await db.query('UPDATE diet_plans SET name = ? WHERE id = ? AND tenant_id = ?', [data.name, planId, tenantId]);
    }
    const [rows] = await db.query('SELECT * FROM diet_plans WHERE id = ? AND tenant_id = ?', [planId, tenantId]);
    return rows[0];
  }

  async deletePlan(tenantId, planId) {
    await db.query('DELETE FROM diet_plans WHERE id = ? AND tenant_id = ?', [planId, tenantId]);
  }

  // ---- MEALS ----
  async getPlanMeals(tenantId, planId) {
    const [rows] = await db.query(
      'SELECT * FROM diet_meals WHERE plan_id = ? AND tenant_id = ? ORDER BY sort_order ASC',
      [planId, tenantId]
    );
    return rows;
  }

  async addMeal(tenantId, planId, { mealName, mealTime, foodDetails }) {
    const [existing] = await db.query('SELECT COUNT(*) as cnt FROM diet_meals WHERE plan_id = ? AND tenant_id = ?', [planId, tenantId]);
    const sortOrder = existing[0].cnt;

    const id = uuidv4();
    await db.query(
      'INSERT INTO diet_meals (id, plan_id, tenant_id, meal_name, meal_time, food_details, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, planId, tenantId, mealName || `Meal ${sortOrder + 1}`, mealTime || null, foodDetails || null, sortOrder]
    );
    return { id, mealName, mealTime, foodDetails, sortOrder };
  }

  async updateMeal(tenantId, mealId, data) {
    const fields = [];
    const params = [];
    if (data.mealName !== undefined) { fields.push('meal_name = ?'); params.push(data.mealName); }
    if (data.mealTime !== undefined) { fields.push('meal_time = ?'); params.push(data.mealTime); }
    if (data.foodDetails !== undefined) { fields.push('food_details = ?'); params.push(data.foodDetails); }
    if (fields.length === 0) throw { status: 400, message: 'No fields to update' };
    params.push(mealId, tenantId);
    await db.query(`UPDATE diet_meals SET ${fields.join(', ')} WHERE id = ? AND tenant_id = ?`, params);
    const [rows] = await db.query('SELECT * FROM diet_meals WHERE id = ? AND tenant_id = ?', [mealId, tenantId]);
    return rows[0];
  }

  async deleteMeal(tenantId, mealId) {
    await db.query('DELETE FROM diet_meals WHERE id = ? AND tenant_id = ?', [mealId, tenantId]);
  }
}

module.exports = new DietService();
