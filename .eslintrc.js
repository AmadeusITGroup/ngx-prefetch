module.exports = {
    root: true,
    parser: '@typescript-eslint/parser',
    env: {
      es6: true
    },
    plugins: [
      '@typescript-eslint',
    ],
    extends: [
      'eslint:recommended',
      'plugin:@typescript-eslint/recommended'
    ],
    overrides: [
      {
        files: [
          'testing/**/*.spec.ts'
        ],
        env: {
          es6: true,
          node: true,
          jest: true
        }
      }
    ]
  };