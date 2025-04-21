const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function (app) {
    app.use(
        '/api/controllerApi',
        createProxyMiddleware({
            target: 'http://localhost:51121',
            changeOrigin: true,
            pathRewrite: {
                '^/api/controllerApi': 'http://localhost:51121',
            },
        }),
    );
};