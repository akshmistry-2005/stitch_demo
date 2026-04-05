const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');

class EventService {
  async list(tenantId, { year, month }) {
    let query = 'SELECT * FROM events WHERE tenant_id = ?';
    let params = [tenantId];
    if (year && month) {
      query += ' AND YEAR(event_date) = ? AND MONTH(event_date) = ?';
      params.push(parseInt(year), parseInt(month));
    }
    query += ' ORDER BY event_date ASC';
    const [rows] = await db.query(query, params);
    return rows;
  }

  async getToday(tenantId) {
    const [rows] = await db.query(
      'SELECT * FROM events WHERE tenant_id = ? AND event_date = CURDATE() ORDER BY created_at ASC',
      [tenantId]
    );
    return rows;
  }

  async create(tenantId, userId, { name, description, eventDate, isCompetition }) {
    const id = uuidv4();
    await db.query(
      'INSERT INTO events (id, tenant_id, name, description, event_date, is_competition, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, tenantId, name, description || null, eventDate, isCompetition || false, userId]
    );
    return { id, name, description, eventDate, isCompetition: isCompetition || false };
  }

  async update(tenantId, eventId, data) {
    const fields = [];
    const params = [];
    if (data.name) { fields.push('name = ?'); params.push(data.name); }
    if (data.description !== undefined) { fields.push('description = ?'); params.push(data.description); }
    if (data.eventDate) { fields.push('event_date = ?'); params.push(data.eventDate); }
    if (data.isCompetition !== undefined) { fields.push('is_competition = ?'); params.push(data.isCompetition); }
    if (fields.length === 0) throw { status: 400, message: 'No fields to update' };
    params.push(eventId, tenantId);
    await db.query(`UPDATE events SET ${fields.join(', ')} WHERE id = ? AND tenant_id = ?`, params);
    const [rows] = await db.query('SELECT * FROM events WHERE id = ? AND tenant_id = ?', [eventId, tenantId]);
    return rows[0];
  }

  async delete(tenantId, eventId) {
    await db.query('DELETE FROM events WHERE id = ? AND tenant_id = ?', [eventId, tenantId]);
  }

  async toggleCompetition(tenantId, eventId) {
    await db.query(
      'UPDATE events SET is_competition = NOT is_competition WHERE id = ? AND tenant_id = ?',
      [eventId, tenantId]
    );
    const [rows] = await db.query('SELECT * FROM events WHERE id = ? AND tenant_id = ?', [eventId, tenantId]);
    return rows[0];
  }

  // ---- PHOTOS ----
  async addPhotos(tenantId, eventId, userId, files) {
    const results = [];
    for (const file of files) {
      const id = uuidv4();
      await db.query(
        'INSERT INTO event_photos (id, event_id, tenant_id, file_path, original_name, uploaded_by) VALUES (?, ?, ?, ?, ?, ?)',
        [id, eventId, tenantId, file.filename, file.originalname, userId]
      );
      results.push({ id, filePath: file.filename, originalName: file.originalname });
    }
    return results;
  }

  async getPhotos(tenantId, eventId) {
    const [rows] = await db.query(
      'SELECT * FROM event_photos WHERE event_id = ? AND tenant_id = ? ORDER BY created_at DESC',
      [eventId, tenantId]
    );
    return rows;
  }

  // ---- WINNERS ----
  async setWinners(tenantId, eventId, winners) {
    // Clear existing winners
    await db.query('DELETE FROM competition_winners WHERE event_id = ? AND tenant_id = ?', [eventId, tenantId]);

    const results = [];
    for (const w of winners) {
      const id = uuidv4();
      await db.query(
        'INSERT INTO competition_winners (id, event_id, tenant_id, position, winner_name, member_id) VALUES (?, ?, ?, ?, ?, ?)',
        [id, eventId, tenantId, w.position, w.winnerName, w.memberId || null]
      );
      results.push({ id, position: w.position, winnerName: w.winnerName });
    }
    return results;
  }

  async getWinners(tenantId, eventId) {
    const [rows] = await db.query(
      'SELECT * FROM competition_winners WHERE event_id = ? AND tenant_id = ? ORDER BY position ASC',
      [eventId, tenantId]
    );
    return rows;
  }
}

module.exports = new EventService();
