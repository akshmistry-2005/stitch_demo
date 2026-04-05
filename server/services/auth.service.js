const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
require('dotenv').config();

class AuthService {
  async signup({ email, password, fullName, gymName }) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      // Check if email exists
      const [existing] = await conn.query('SELECT id FROM admin_users WHERE email = ?', [email]);
      if (existing.length > 0) {
        throw { status: 409, message: 'Email already registered' };
      }

      // Create gym/tenant
      const tenantId = uuidv4();
      await conn.query(
        'INSERT INTO gyms (id, name, email) VALUES (?, ?, ?)',
        [tenantId, gymName, email]
      );

      // Create admin user
      const userId = uuidv4();
      const passwordHash = await bcrypt.hash(password, 12);
      await conn.query(
        'INSERT INTO admin_users (id, tenant_id, email, password_hash, full_name, role) VALUES (?, ?, ?, ?, ?, ?)',
        [userId, tenantId, email, passwordHash, fullName, 'owner']
      );

      await conn.commit();

      const tokens = this.generateTokens({ userId, tenantId, email, role: 'owner' });

      return {
        user: { id: userId, email, fullName, role: 'owner', tenantId },
        gym: { id: tenantId, name: gymName },
        ...tokens
      };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  async login({ email, password }) {
    const [users] = await db.query(
      'SELECT au.*, g.name as gym_name FROM admin_users au JOIN gyms g ON au.tenant_id = g.id WHERE au.email = ? AND au.is_active = TRUE',
      [email]
    );

    if (users.length === 0) {
      throw { status: 401, message: 'Invalid email or password' };
    }

    const user = users[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      throw { status: 401, message: 'Invalid email or password' };
    }

    const tokens = this.generateTokens({
      userId: user.id,
      tenantId: user.tenant_id,
      email: user.email,
      role: user.role
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        tenantId: user.tenant_id,
        avatarUrl: user.avatar_url
      },
      gym: { id: user.tenant_id, name: user.gym_name },
      ...tokens
    };
  }

  async googleAuth({ googleId, email, fullName, avatarUrl }) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      // Check if user exists with this Google ID or email
      const [existing] = await conn.query(
        'SELECT au.*, g.name as gym_name FROM admin_users au JOIN gyms g ON au.tenant_id = g.id WHERE au.google_id = ? OR au.email = ?',
        [googleId, email]
      );

      let user, gym;

      if (existing.length > 0) {
        user = existing[0];
        // Update Google ID if not set
        if (!user.google_id) {
          await conn.query('UPDATE admin_users SET google_id = ?, avatar_url = ? WHERE id = ?',
            [googleId, avatarUrl, user.id]);
        }
        gym = { id: user.tenant_id, name: user.gym_name };
      } else {
        // Create new gym and admin
        const tenantId = uuidv4();
        const userId = uuidv4();
        const gymName = `${fullName}'s Gym`;

        await conn.query('INSERT INTO gyms (id, name, email) VALUES (?, ?, ?)',
          [tenantId, gymName, email]);

        await conn.query(
          'INSERT INTO admin_users (id, tenant_id, email, full_name, google_id, avatar_url, role) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [userId, tenantId, email, fullName, googleId, avatarUrl, 'owner']
        );

        user = { id: userId, tenant_id: tenantId, email, full_name: fullName, role: 'owner', avatar_url: avatarUrl };
        gym = { id: tenantId, name: gymName };
      }

      await conn.commit();

      const tokens = this.generateTokens({
        userId: user.id,
        tenantId: user.tenant_id,
        email: user.email,
        role: user.role
      });

      return {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          role: user.role,
          tenantId: user.tenant_id,
          avatarUrl: user.avatar_url
        },
        gym,
        ...tokens
      };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  async getProfile(userId, tenantId) {
    const [users] = await db.query(
      'SELECT au.id, au.email, au.full_name, au.role, au.avatar_url, au.tenant_id, g.name as gym_name FROM admin_users au JOIN gyms g ON au.tenant_id = g.id WHERE au.id = ? AND au.tenant_id = ?',
      [userId, tenantId]
    );
    if (users.length === 0) throw { status: 404, message: 'User not found' };
    const u = users[0];
    return {
      id: u.id, email: u.email, fullName: u.full_name, role: u.role,
      avatarUrl: u.avatar_url, tenantId: u.tenant_id, gymName: u.gym_name
    };
  }

  generateTokens({ userId, tenantId, email, role }) {
    const accessToken = jwt.sign(
      { userId, tenantId, email, role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
    );
    const refreshToken = jwt.sign(
      { userId, tenantId },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
    );
    return { accessToken, refreshToken };
  }

  async refreshToken(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
      const [users] = await db.query(
        'SELECT id, tenant_id, email, role FROM admin_users WHERE id = ? AND tenant_id = ?',
        [decoded.userId, decoded.tenantId]
      );
      if (users.length === 0) throw { status: 401, message: 'User not found' };
      const u = users[0];
      return this.generateTokens({ userId: u.id, tenantId: u.tenant_id, email: u.email, role: u.role });
    } catch {
      throw { status: 401, message: 'Invalid refresh token' };
    }
  }
}

module.exports = new AuthService();
