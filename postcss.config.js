module.exports = {
  plugins: [
    require('tailwindcss'),
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
