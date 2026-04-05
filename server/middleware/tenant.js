// Tenant middleware - ensures every request is scoped to a tenant
// This runs AFTER auth middleware, which sets req.tenantId from JWT
const tenantMiddleware = (req, res, next) => {
  if (!req.tenantId) {
    return res.status(403).json({
      success: false,
      message: 'Tenant context missing. Access denied.'
    });
  }

  // Add tenant-scoped query helper
  req.tenantScope = (query, params = []) => {
    return {
      query,
      params: [req.tenantId, ...params]
    };
  };

  next();
};

module.exports = tenantMiddleware;
