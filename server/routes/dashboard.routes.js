const express = require('express');
const db = require('../config/database');
const { success, error } = require('../utils/response');

const router = express.Router();

// GET /api/dashboard/stats
router.get('/stats', async (req, res) => {
  try {
    const tenantId = req.tenantId;

    const [[{ activeUsers }]] = await db.query(
      "SELECT COUNT(*) as activeUsers FROM gym_members WHERE tenant_id = ? AND status = 'active'", [tenantId]
    );
    const [[{ totalTrainers }]] = await db.query(
      "SELECT COUNT(*) as totalTrainers FROM trainers WHERE tenant_id = ? AND status = 'active'", [tenantId]
    );
    const [[{ newToday }]] = await db.query(
      "SELECT COUNT(*) as newToday FROM gym_members WHERE tenant_id = ? AND DATE(created_at) = CURDATE()", [tenantId]
    );
    const [[{ totalStaff }]] = await db.query(
      "SELECT COUNT(*) as totalStaff FROM staff_members WHERE tenant_id = ? AND status = 'active'", [tenantId]
    );

    return success(res, { activeUsers, totalTrainers, newToday, totalStaff });
  } catch (err) {
    return error(res, err.message);
  }
});

// GET /api/dashboard/events/today
router.get('/events/today', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM events WHERE tenant_id = ? AND event_date = CURDATE() ORDER BY created_at ASC',
      [req.tenantId]
    );
    return success(res, rows);
  } catch (err) {
    return error(res, err.message);
  }
});

module.exports = router;
