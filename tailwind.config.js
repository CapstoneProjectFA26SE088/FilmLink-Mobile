const { colors, radius } = require('./src/shared/theme/tokens.ts');

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    colors,
    borderRadius: radius,
    extend: {},
  },
  plugins: [],
};
