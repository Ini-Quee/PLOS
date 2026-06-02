function validateInput(schema) {
  return async (req, res, next) => {
    if (Array.isArray(schema)) {
      for (const validation of schema) {
        const result = await validation.run(req);
        if (!result.isEmpty()) break;
      }
      const { validationResult } = require('express-validator');
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array().map((issue) => ({
            field: issue.path || issue.param,
            message: issue.msg,
          })),
        });
      }
      return next();
    }

    const result = schema.safeParse(req.body);

    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));

      return res.status(400).json({
        error: 'Validation failed',
        details: errors,
      });
    }

    req.body = result.data;
    next();
  };
}

module.exports = { validateInput };
