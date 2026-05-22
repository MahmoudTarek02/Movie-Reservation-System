const { createProxyMiddleware, fixRequestBody } = require('http-proxy-middleware');

const proxyErrorHandler = require('../middleware/proxyErrorHandler');

module.exports = ({ serviceName, target }) =>
  createProxyMiddleware({
    target,
    changeOrigin: true,
    xfwd: true,
    secure: false,
    cookieDomainRewrite: '',
    on: {
      error: proxyErrorHandler(serviceName),
      proxyReq: (proxyReq, req) => {
        if (req.headers.cookie) {
          proxyReq.setHeader('cookie', req.headers.cookie);
        }

        if (req.headers.authorization) {
          proxyReq.setHeader('authorization', req.headers.authorization);
        }

        fixRequestBody(proxyReq, req);
      }
    }
  });
