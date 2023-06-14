// This file is used as the package entry point

const path = require('path')

exports.middleware = (express) => express.static(path.join(__dirname, 'build'))
