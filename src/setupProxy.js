const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api/controllerApi',
    createProxyMiddleware({
      target: 'http://4.231.160.110:51121',
      changeOrigin: true,
      pathRewrite: {
        '^/api/controllerApi':'http://4.231.160.110:51121',
        },
    }),
  );
};