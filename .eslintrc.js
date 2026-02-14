module.exports = {
  parser: '@typescript-eslint/parser',
  extends: [
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'prettier'
  ],
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true
    }
  },
  rules: {
    semi: 'off',

    // 👇 důležité – vypne prettier jako error
    'prettier/prettier': 'off',

    '@typescript-eslint/ban-ts-ignore': 0,
    '@typescript-eslint/explicit-member-accessibility': 0,
    '@typescript-eslint/ban-ts-comment': 0,

    eqeqeq: 'error',
    'max-len': 'off',
    'new-parens': 'error',
    'no-bitwise': 'error',
    'no-console': ['warn', { allow: ['warn', 'info', 'error'] }],
    'no-caller': 'error',
    'no-multiple-empty-lines': ['error', { max: 2, maxEOF: 1, maxBOF: 0 }],
    'quote-props': ['error', 'as-needed'],
    'no-irregular-whitespace': 'warn',

    'react-hooks/exhaustive-deps': 0,
    'react/display-name': 0,
    'react/jsx-uses-react': 'off',
    'react/react-in-jsx-scope': 'off',

    'sort-imports-es6-autofix/sort-imports-es6': [
      2,
      {
        ignoreCase: false,
        ignoreMemberSort: false,
        memberSyntaxSortOrder: ['none', 'all', 'multiple', 'single']
      }
    ]
  },
  plugins: ['sort-imports-es6-autofix'],
  settings: {
    react: {
      version: 'detect'
    }
  }
}