const crypto = require('crypto');

/**
 * Generate a unique member ID in format: GYM-XXXXX
 * Maps both tenant and individual identity
 */
function generateMemberId(tenantPrefix) {
  const prefix = tenantPrefix ? tenantPrefix.substring(0, 3).toUpperCase() : 'GYM';
  const num = crypto.randomInt(10000, 99999);
  return `${prefix}-${num}`;
}

/**
 * Generate a unique staff ID in format: STF-XXXXX
 */
function generateStaffId(tenantPrefix) {
  const prefix = tenantPrefix ? tenantPrefix.substring(0, 3).toUpperCase() : 'STF';
  const num = crypto.randomInt(10000, 99999);
  return `STF-${num}`;
}

/**
 * Generate a short tenant code from gym name
 */
function generateTenantCode(gymName) {
  return gymName.replace(/[^a-zA-Z0-9]/g, '').substring(0, 3).toUpperCase();
}

module.exports = { generateMemberId, generateStaffId, generateTenantCode };
