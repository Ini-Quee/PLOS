const { pool } = require('../db/connection');

function auditLog(action, resource) {
  return async (req, res, next) => {
    const originalJson = res.json.bind(res);

    res.json = function (body) {
      const status = res.statusCode < 400 ? 'success' : 'failure';

      pool
        .query(
          `INSERT INTO audit_logs
            (user_id, action, resource, ip_address,
             user_agent, status, details)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            req.user ? req.user.id : null,
            action,
            resource,
            req.ip,
            req.get('user-agent'),
            status,
            JSON.stringify({
              method: req.method,
              path: req.path,
              statusCode: res.statusCode,
            }),
          ]
        )
        .catch((err) => {
          console.error('Audit log error:', err);
        });

      return originalJson(body);
    };

    next();
  };
}

module.exports = { auditLog };