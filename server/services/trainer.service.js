const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');

class TrainerService {
  async list(tenantId) {
    const [rows] = await db.query(
      `SELECT t.*, COUNT(ta.id) as assigned_members_count
       FROM trainers t
       LEFT JOIN trainer_assignments ta ON t.id = ta.trainer_id
       WHERE t.tenant_id = ? AND t.status = 'active'
       GROUP BY t.id ORDER BY t.created_at DESC`,
      [tenantId]
    );
    return rows;
  }

  async create(tenantId, userId, { fullName, email, phone, specialization }) {
    const id = uuidv4();
    await db.query(
      `INSERT INTO trainers (id, tenant_id, full_name, email, phone, specialization, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, tenantId, fullName, email || null, phone || null, specialization || null, userId]
    );
    return { id, fullName, email, phone, specialization };
  }

  async update(tenantId, trainerId, data) {
    const fields = [];
    const params = [];
    if (data.fullName) { fields.push('full_name = ?'); params.push(data.fullName); }
    if (data.email !== undefined) { fields.push('email = ?'); params.push(data.email); }
    if (data.phone !== undefined) { fields.push('phone = ?'); params.push(data.phone); }
    if (data.specialization !== undefined) { fields.push('specialization = ?'); params.push(data.specialization); }
    if (data.status) { fields.push('status = ?'); params.push(data.status); }
    if (fields.length === 0) throw { status: 400, message: 'No fields to update' };
    params.push(trainerId, tenantId);
    await db.query(`UPDATE trainers SET ${fields.join(', ')} WHERE id = ? AND tenant_id = ?`, params);
    const [rows] = await db.query('SELECT * FROM trainers WHERE id = ? AND tenant_id = ?', [trainerId, tenantId]);
    return rows[0];
  }

  async delete(tenantId, trainerId) {
    await db.query('DELETE FROM trainer_assignments WHERE trainer_id = ? AND tenant_id = ?', [trainerId, tenantId]);
    await db.query('UPDATE trainers SET status = ? WHERE id = ? AND tenant_id = ?', ['inactive', trainerId, tenantId]);
  }

  async assignTrainer(tenantId, userId, { trainerId, memberId }) {
    // Check member doesn't already have a trainer (UNIQUE constraint on member_id handles this too)
    const [existing] = await db.query(
      'SELECT ta.id, t.full_name as trainer_name FROM trainer_assignments ta JOIN trainers t ON ta.trainer_id = t.id WHERE ta.member_id = ? AND ta.tenant_id = ?',
      [memberId, tenantId]
    );
    if (existing.length > 0) {
      throw { status: 409, message: `Member is already assigned to trainer: ${existing[0].trainer_name}. Unassign first.` };
    }

    // Verify trainer and member belong to same tenant
    const [trainer] = await db.query('SELECT id FROM trainers WHERE id = ? AND tenant_id = ?', [trainerId, tenantId]);
    if (trainer.length === 0) throw { status: 404, message: 'Trainer not found in your gym' };

    const [member] = await db.query('SELECT id FROM gym_members WHERE id = ? AND tenant_id = ?', [memberId, tenantId]);
    if (member.length === 0) throw { status: 404, message: 'Member not found in your gym' };

    const id = uuidv4();
    await db.query(
      'INSERT INTO trainer_assignments (id, tenant_id, trainer_id, member_id, assigned_by) VALUES (?, ?, ?, ?, ?)',
      [id, tenantId, trainerId, memberId, userId]
    );
    return { id, trainerId, memberId };
  }

  async unassignTrainer(tenantId, memberId) {
    await db.query('DELETE FROM trainer_assignments WHERE member_id = ? AND tenant_id = ?', [memberId, tenantId]);
  }

  async getTrainerMembers(tenantId, trainerId) {
    const [rows] = await db.query(
      `SELECT gm.id, gm.full_name, gm.email, gm.unique_member_id, gm.status, ta.created_at as assigned_at
       FROM trainer_assignments ta
       JOIN gym_members gm ON ta.member_id = gm.id
       WHERE ta.trainer_id = ? AND ta.tenant_id = ?
       ORDER BY ta.created_at DESC`,
      [trainerId, tenantId]
    );
    return rows;
  }
}

module.exports = new TrainerService();
