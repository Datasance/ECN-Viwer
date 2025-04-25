module.exports = {
    plugins: [
        require('@tailwindcss/postcss'),
        require('autoprefixer'),
      ],
    overrides: {
      'tailwindcss': {
        exclude: [
          '**/node_modules/leaflet/*',
        ],
      },
    },
  }
  