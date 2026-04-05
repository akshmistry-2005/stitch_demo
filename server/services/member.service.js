const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const { generateMemberId } = require('../utils/idGenerator');
const emailService = require('./email.service');

class MemberService {
  async list(tenantId, { page = 1, limit = 20, search = '' }) {
    const offset = (page - 1) * limit;
    let whereClause = 'WHERE gm.tenant_id = ?';
    let params = [tenantId];

    if (search) {
      whereClause += ' AND (gm.full_name LIKE ? OR gm.email LIKE ? OR gm.unique_member_id LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s);
    }

    const [[{ total }]] = await db.query(`SELECT COUNT(*) as total FROM gym_members gm ${whereClause}`, params);
    const [rows] = await db.query(
      `SELECT gm.*, t.full_name as trainer_name, t.id as assigned_trainer_id
       FROM gym_members gm
       LEFT JOIN trainer_assignments ta ON gm.id = ta.member_id AND ta.tenant_id = gm.tenant_id
       LEFT JOIN trainers t ON ta.trainer_id = t.id
       ${whereClause} ORDER BY gm.created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    return { members: rows, total, page: parseInt(page), limit: parseInt(limit) };
  }

  async create(tenantId, userId, { fullName, email, phone, heightCm }) {
    // Get gym name for ID prefix
    const [[gym]] = await db.query('SELECT name FROM gyms WHERE id = ?', [tenantId]);
    const uniqueMemberId = generateMemberId(gym?.name);

    // Check uniqueness
    const [existing] = await db.query('SELECT id FROM gym_members WHERE unique_member_id = ?', [uniqueMemberId]);
    const finalId = existing.length > 0 ? generateMemberId(gym?.name) : uniqueMemberId;

    const id = uuidv4();
    await db.query(
      `INSERT INTO gym_members (id, tenant_id, unique_member_id, full_name, email, phone, height_cm, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, tenantId, finalId, fullName, email, phone || null, heightCm || null, userId]
    );

    // Send email with unique ID
    try {
      await emailService.sendMemberInvite({ to: email, memberName: fullName, uniqueId: finalId, gymName: gym?.name || 'GymFlow' });
      await db.query(
        'INSERT INTO invite_logs (id, tenant_id, recipient_email, recipient_type, unique_id_sent, status) VALUES (?, ?, ?, ?, ?, ?)',
        [uuidv4(), tenantId, email, 'member', finalId, 'sent']
      );
    } catch (emailErr) {
      console.error('Email send failed:', emailErr.message);
      await db.query(
        'INSERT INTO invite_logs (id, tenant_id, recipient_email, recipient_type, unique_id_sent, status) VALUES (?, ?, ?, ?, ?, ?)',
        [uuidv4(), tenantId, email, 'member', finalId, 'failed']
      );
    }

    return { id, uniqueMemberId: finalId, fullName, email, phone, heightCm };
  }

  async getById(tenantId, memberId) {
    const [rows] = await db.query(
      `SELECT gm.*, t.full_name as trainer_name FROM gym_members gm
       LEFT JOIN trainer_assignments ta ON gm.id = ta.member_id
       LEFT JOIN trainers t ON ta.trainer_id = t.id
       WHERE gm.id = ? AND gm.tenant_id = ?`,
      [memberId, tenantId]
    );
    if (rows.length === 0) throw { status: 404, message: 'Member not found' };
    return rows[0];
  }

  async update(tenantId, memberId, data) {
    const fields = [];
    const params = [];
    if (data.fullName) { fields.push('full_name = ?'); params.push(data.fullName); }
    if (data.email) { fields.push('email = ?'); params.push(data.email); }
    if (data.phone !== undefined) { fields.push('phone = ?'); params.push(data.phone); }
    if (data.heightCm !== undefined) { fields.push('height_cm = ?'); params.push(data.heightCm); }
    if (data.status) { fields.push('status = ?'); params.push(data.status); }

    if (fields.length === 0) throw { status: 400, message: 'No fields to update' };

    params.push(memberId, tenantId);
    await db.query(`UPDATE gym_members SET ${fields.join(', ')} WHERE id = ? AND tenant_id = ?`, params);
    return this.getById(tenantId, memberId);
  }

  async delete(tenantId, memberId) {
    await db.query('UPDATE gym_members SET status = ? WHERE id = ? AND tenant_id = ?', ['inactive', memberId, tenantId]);
  }
}

module.exports = new MemberService();
