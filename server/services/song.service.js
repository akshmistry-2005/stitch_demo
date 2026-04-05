const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const { getIO } = require('../config/socket');

class SongService {
  async getQueue(tenantId) {
    const [rows] = await db.query(
      `SELECT * FROM song_requests WHERE tenant_id = ? AND status IN ('queued', 'playing')
       ORDER BY CASE WHEN status = 'playing' THEN 0 ELSE 1 END, queue_position ASC, created_at ASC`,
      [tenantId]
    );
    return rows;
  }

  async createRequest(tenantId, { songTitle, artist, requestedBy }) {
    // Get next queue position
    const [[{ maxPos }]] = await db.query(
      `SELECT COALESCE(MAX(queue_position), 0) as maxPos FROM song_requests WHERE tenant_id = ? AND status = 'queued'`,
      [tenantId]
    );

    const id = uuidv4();
    const queuePosition = maxPos + 1;

    await db.query(
      'INSERT INTO song_requests (id, tenant_id, song_title, artist, requested_by, queue_position, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, tenantId, songTitle, artist || null, requestedBy, queuePosition, 'queued']
    );

    const request = { id, songTitle, artist, requestedBy, queuePosition, status: 'queued', createdAt: new Date() };

    // Broadcast to tenant room via Socket.io
    try {
      const io = getIO();
      io.to(`gym:${tenantId}`).emit('song:new-request', request);
    } catch (err) {
      console.error('Socket broadcast failed:', err.message);
    }

    return request;
  }

  async updateStatus(tenantId, requestId, { status }) {
    await db.query(
      'UPDATE song_requests SET status = ? WHERE id = ? AND tenant_id = ?',
      [status, requestId, tenantId]
    );

    const [rows] = await db.query('SELECT * FROM song_requests WHERE id = ? AND tenant_id = ?', [requestId, tenantId]);

    // Broadcast status update
    try {
      const io = getIO();
      io.to(`gym:${tenantId}`).emit('song:status-update', rows[0]);

      // Send full queue refresh
      const queue = await this.getQueue(tenantId);
      io.to(`gym:${tenantId}`).emit('song:queue-update', queue);
    } catch (err) {
      console.error('Socket broadcast failed:', err.message);
    }

    return rows[0];
  }

  async clearPlayed(tenantId) {
    await db.query("DELETE FROM song_requests WHERE tenant_id = ? AND status IN ('played', 'skipped')", [tenantId]);
  }
}

module.exports = new SongService();
