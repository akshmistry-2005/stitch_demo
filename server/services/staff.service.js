const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const { generateStaffId } = require('../utils/idGenerator');
const emailService = require('./email.service');

class StaffService {
  async list(tenantId, { page = 1, limit = 20, search = '' }) {
    const offset = (page - 1) * limit;
    let whereClause = 'WHERE tenant_id = ?';
    let params = [tenantId];
    if (search) {
      whereClause += ' AND (full_name LIKE ? OR email LIKE ? OR unique_staff_id LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s);
    }
    const [[{ total }]] = await db.query(`SELECT COUNT(*) as total FROM staff_members ${whereClause}`, params);
    const [rows] = await db.query(
      `SELECT * FROM staff_members ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );
    return { staff: rows, total, page: parseInt(page), limit: parseInt(limit) };
  }

  async create(tenantId, userId, { fullName, email, phone, role }) {
    const [[gym]] = await db.query('SELECT name FROM gyms WHERE id = ?', [tenantId]);
    const uniqueStaffId = generateStaffId(gym?.name);

    const id = uuidv4();
    await db.query(
      `INSERT INTO staff_members (id, tenant_id, unique_staff_id, full_name, email, phone, role, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, tenantId, uniqueStaffId, fullName, email, phone || null, role || null, userId]
    );

    try {
      await emailService.sendStaffInvite({ to: email, staffName: fullName, uniqueId: uniqueStaffId, gymName: gym?.name || 'GymFlow' });
      await db.query(
        'INSERT INTO invite_logs (id, tenant_id, recipient_email, recipient_type, unique_id_sent, status) VALUES (?, ?, ?, ?, ?, ?)',
        [uuidv4(), tenantId, email, 'staff', uniqueStaffId, 'sent']
      );
    } catch {
      await db.query(
        'INSERT INTO invite_logs (id, tenant_id, recipient_email, recipient_type, unique_id_sent, status) VALUES (?, ?, ?, ?, ?, ?)',
        [uuidv4(), tenantId, email, 'staff', uniqueStaffId, 'failed']
      );
    }

    return { id, uniqueStaffId, fullName, email, phone, role };
  }

  async update(tenantId, staffId, data) {
    const fields = [];
    const params = [];
    if (data.fullName) { fields.push('full_name = ?'); params.push(data.fullName); }
    if (data.email) { fields.push('email = ?'); params.push(data.email); }
    if (data.phone !== undefined) { fields.push('phone = ?'); params.push(data.phone); }
    if (data.role !== undefined) { fields.push('role = ?'); params.push(data.role); }
    if (data.status) { fields.push('status = ?'); params.push(data.status); }
    if (fields.length === 0) throw { status: 400, message: 'No fields to update' };
    params.push(staffId, tenantId);
    await db.query(`UPDATE staff_members SET ${fields.join(', ')} WHERE id = ? AND tenant_id = ?`, params);
    const [rows] = await db.query('SELECT * FROM staff_members WHERE id = ? AND tenant_id = ?', [staffId, tenantId]);
    return rows[0];
  }

  async delete(tenantId, staffId) {
    await db.query('UPDATE staff_members SET status = ? WHERE id = ? AND tenant_id = ?', ['inactive', staffId, tenantId]);
  }
}

module.exports = new StaffService();
