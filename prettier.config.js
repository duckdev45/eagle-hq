/** @type {import('prettier').Config} */
module.exports = {
  arrowParens: 'always',
  bracketSpacing: true,
  bracketSameLine: false,
  jsxSingleQuote: true,
  plugins: ['prettier-plugin-tailwindcss'],
  semi: false,
  singleQuote: true,
  tabWidth: 2,
  tailwindFunctions: ['cn'],
  trailingComma: 'es5',
}
