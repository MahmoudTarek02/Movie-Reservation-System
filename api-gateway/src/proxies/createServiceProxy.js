const { createProxyMiddleware } = require('http-proxy-middleware');

const proxyErrorHandler = require('../middleware/proxyErrorHandler');

const normalizePath = (basePath, requestPath) => {
  const normalizedBasePath = basePath.endsWith('/') ? basePath.slice(0, -1) : basePath;
  const normalizedRequestPath = requestPath.startsWith('/') ? requestPath : `/${requestPath}`;
  return `${normalizedBasePath}${normalizedRequestPath}`;
};

module.exports = ({ serviceName, target, targetBasePath }) =>
  createProxyMiddleware({
    target,
    changeOrigin: true,
    xfwd: true,
    secure: false,
    cookieDomainRewrite: '',
    pathRewrite: (path, req) => {
      const relativePath = req.url || '/';
      return normalizePath(targetBasePath, relativePath);
    },
    onError: proxyErrorHandler(serviceName),
    onProxyReq: (proxyReq, req) => {
      if (req.headers.cookie) {
        proxyReq.setHeader('cookie', req.headers.cookie);
      }

      if (req.headers.authorization) {
        proxyReq.setHeader('authorization', req.headers.authorization);
      }
    }
  });
