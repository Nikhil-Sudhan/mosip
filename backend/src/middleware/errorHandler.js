function notFound(req, res, next) {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: 'Route not found' },
  });
}

function errorHandler(err, req, res, next) {
  // eslint-disable-next-line no-console
  console.error('Error:', err);
  console.error('Stack:', err.stack);

  if (err.name === 'ZodError') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request payload',
        details: err.errors,
      },
    });
  }

  // Database connection errors
  if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
    return res.status(503).json({
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: 'Database connection failed. Please check your database configuration.',
      },
    });
  }

  const status = err.status || 500;
  res.status(status).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: err.message || 'Something went wrong',
    },
  });
}

module.exports = {
  notFound,
  errorHandler,
};

