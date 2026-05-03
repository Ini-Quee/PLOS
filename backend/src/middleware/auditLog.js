const { pool } = require('../db/connection');

/**
 * Per-route audit log factory — explicit action + resource labels.
 * Usage: router.post('/path', auditLog('action_name', 'table_name'), handler)
 */
function auditLog(action, resource) {
  return async (req, res, next) => {
    const originalJson = res.json.bind(res);

    res.json = function (body) {
      const status = res.statusCode < 400 ? 'success' : 'failure';
      pool.query(
        `INSERT INTO audit_logs (user_id, action, resource, ip_address, user_agent, status, details)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [
          req.user?.id || null,
          action,
          resource,
          req.ip,
          req.get('user-agent'),
          status,
          JSON.stringify({ method: req.method, path: req.path, statusCode: res.statusCode }),
        ]
      ).catch(err => console.error('Audit log error:', err));
      return originalJson(body);
    };

    next();
  };
}

/**
 * Global audit middleware — logs every POST/PUT/PATCH/DELETE across all routes.
 * Derives action from method + path automatically.
 * Mount AFTER authenticate so req.user is available.
 */
function globalAuditLog(req, res, next) {
  // Only log mutations
  if (!['POST','PUT','PATCH','DELETE'].includes(req.method)) return next();

  const originalJson = res.json.bind(res);

  res.json = function (body) {
    const status   = res.statusCode < 400 ? 'success' : 'failure';
    const segments = req.path.replace(/^\/api\//, '').split('/').filter(Boolean);
    const resource = segments[0] || 'unknown';
    const action   = `${req.method.toLowerCase()}_${segments.slice(0,2).join('_')}`;

    pool.query(
      `INSERT INTO audit_logs (user_id, action, resource, ip_address, user_agent, status, details)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [
        req.user?.id || null,
        action,
        resource,
        req.ip,
        req.get('user-agent'),
        status,
        JSON.stringify({
          method:     req.method,
          path:       req.path,
          statusCode: res.statusCode,
          body_keys:  req.body ? Object.keys(req.body) : [],
        }),
      ]
    ).catch(err => console.error('Global audit log error:', err));

    return originalJson(body);
  };

  next();
}

module.exports = { auditLog, globalAuditLog };