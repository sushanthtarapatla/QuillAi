export const errorHandler = (err, req, res, next) => {
  console.error('Unhandled Server Error:', err);

  // Handle Multer specific errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'File size limit exceeded. Max size allowed is 25MB.' });
  }

  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    error: err.message || 'An internal server error occurred.',
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
};
