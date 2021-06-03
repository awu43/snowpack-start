module.exports = {
  plugins: [
    require('tailwindcss'),
    process.env.NODE_ENV === 'production'
      ? require('postcss-preset-env')
      // : require('autoprefixer'), // For some processing in dev
      // : null, // For no processing in dev
    // If PostCSS is too slow in development,
    // use above ternary to limit processing to production
    // https://flaviocopes.com/tailwind-setup/#in-development-avoid-too-much-processing
    process.env.NODE_ENV === 'production' ? require('cssnano') : null,
  ],
};
