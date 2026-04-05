const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');

class WorkoutService {
  // ---- CATEGORIES ----
  async listCategories(tenantId) {
    const [rows] = await db.query(
      `SELECT wc.*, COUNT(we.id) as exercise_count
       FROM workout_categories wc
       LEFT JOIN workout_exercises we ON wc.id = we.category_id
       WHERE wc.tenant_id = ?
       GROUP BY wc.id ORDER BY wc.created_at DESC`,
      [tenantId]
    );
    return rows;
  }

  async createCategory(tenantId, userId, { name, trainerGuidance }) {
    const id = uuidv4();
    await db.query(
      'INSERT INTO workout_categories (id, tenant_id, name, trainer_guidance, created_by) VALUES (?, ?, ?, ?, ?)',
      [id, tenantId, name, trainerGuidance || null, userId]
    );
    return { id, name, trainerGuidance, exerciseCount: 0 };
  }

  async updateCategory(tenantId, categoryId, data) {
    const fields = [];
    const params = [];
    if (data.name) { fields.push('name = ?'); params.push(data.name); }
    if (data.trainerGuidance !== undefined) { fields.push('trainer_guidance = ?'); params.push(data.trainerGuidance); }
    if (fields.length === 0) throw { status: 400, message: 'No fields to update' };
    params.push(categoryId, tenantId);
    await db.query(`UPDATE workout_categories SET ${fields.join(', ')} WHERE id = ? AND tenant_id = ?`, params);
    const [rows] = await db.query('SELECT * FROM workout_categories WHERE id = ? AND tenant_id = ?', [categoryId, tenantId]);
    return rows[0];
  }

  async deleteCategory(tenantId, categoryId) {
    await db.query('DELETE FROM workout_categories WHERE id = ? AND tenant_id = ?', [categoryId, tenantId]);
  }

  // ---- EXERCISES ----
  async getExercises(tenantId, categoryId) {
    const [rows] = await db.query(
      'SELECT * FROM workout_exercises WHERE category_id = ? AND tenant_id = ? ORDER BY sort_order ASC',
      [categoryId, tenantId]
    );
    return rows;
  }

  async addExercises(tenantId, categoryId, exercises) {
    // Verify category belongs to tenant
    const [cat] = await db.query('SELECT id FROM workout_categories WHERE id = ? AND tenant_id = ?', [categoryId, tenantId]);
    if (cat.length === 0) throw { status: 404, message: 'Category not found' };

    const results = [];
    for (let i = 0; i < exercises.length; i++) {
      const ex = exercises[i];
      const id = uuidv4();
      await db.query(
        'INSERT INTO workout_exercises (id, category_id, tenant_id, exercise_name, sets_count, repetitions, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [id, categoryId, tenantId, ex.exerciseName, ex.sets || 3, ex.repetitions || 10, i]
      );
      results.push({ id, exerciseName: ex.exerciseName, sets: ex.sets, repetitions: ex.repetitions });
    }
    return results;
  }

  async updateExercise(tenantId, exerciseId, data) {
    const fields = [];
    const params = [];
    if (data.exerciseName) { fields.push('exercise_name = ?'); params.push(data.exerciseName); }
    if (data.sets !== undefined) { fields.push('sets_count = ?'); params.push(data.sets); }
    if (data.repetitions !== undefined) { fields.push('repetitions = ?'); params.push(data.repetitions); }
    if (data.sortOrder !== undefined) { fields.push('sort_order = ?'); params.push(data.sortOrder); }
    if (fields.length === 0) throw { status: 400, message: 'No fields to update' };
    params.push(exerciseId, tenantId);
    await db.query(`UPDATE workout_exercises SET ${fields.join(', ')} WHERE id = ? AND tenant_id = ?`, params);
    const [rows] = await db.query('SELECT * FROM workout_exercises WHERE id = ? AND tenant_id = ?', [exerciseId, tenantId]);
    return rows[0];
  }

  async deleteExercise(tenantId, exerciseId) {
    await db.query('DELETE FROM workout_exercises WHERE id = ? AND tenant_id = ?', [exerciseId, tenantId]);
  }
}

module.exports = new WorkoutService();
