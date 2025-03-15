const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function (app) {
    app.use(
        '/api/controllerApi',
        createProxyMiddleware({
            target: 'http://4.207.196.220:51121',
            changeOrigin: true,
            pathRewrite: {
                '^/api/controllerApi': 'http://4.207.196.220:51121',
            },
        }),
    );
};
