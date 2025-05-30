module.exports = {
  parser: '@typescript-eslint/parser',
  extends: [
    'eslint:recommended',
  ],
  plugins: ['@typescript-eslint'],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  env: {
    node: true,
    es6: true,
    jest: true,
  },
  rules: {
    '@typescript-eslint/no-unused-vars': ['error', { 'argsIgnorePattern': '^_' }],
    'no-unused-vars': 'off',
    'no-console': 'off',
    'no-undef': 'off',
  },
  ignorePatterns: ['dist/', 'node_modules/', '*.js', 'jest.config.js'],
}; 