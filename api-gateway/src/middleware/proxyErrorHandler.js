module.exports = (serviceName) => (err, req, res) => {
  if (res.headersSent) {
    return;
  }

  res.status(502).json({
    status: 'error',
    message: `${serviceName} service is unavailable`,
    details: err.message
  });
};
