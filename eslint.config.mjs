import { fixupConfigRules, fixupPluginRules } from '@eslint/compat';
import react from 'eslint-plugin-react';
import globals from 'globals';
import tsParser from '@typescript-eslint/parser';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import js from '@eslint/js';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

export default [
  ...fixupConfigRules(
    compat.extends(
      'eslint:recommended',
      'plugin:@typescript-eslint/recommended',
      'plugin:react/recommended'
    )
  ),
  {
    ignores: [
      'src/engine.js',
      'src/engine.d.ts',
      'src/engine_bg.js',
      'src/engine_bg.wasm.d.ts',
      'node_modules',
      '.cache',
      'public',
      'external_mixins',
      'triangles',
    ],
  },
  {
    plugins: {
      react: fixupPluginRules(react),
    },

    languageOptions: {
      globals: {
        ...globals.browser,
        module: true,
        __dirname: true,
        require: true,
        process: true,
        exports: true,
      },

      parser: tsParser,
      ecmaVersion: 2017,
      sourceType: 'module',

      parserOptions: {
        ecmaFeatures: {
          experimentalObjectRestSpread: true,
          jsx: true,
        },
      },
    },

    rules: {
      indent: 0,

      quotes: [
        2,
        'single',
        {
          avoidEscape: true,
        },
      ],

      'react/display-name': 0,
      'react/forbid-component-props': 0,

      'react/jsx-filename-extension': [
        1,
        {
          extensions: ['.js', '.jsx', '.tsx'],
        },
      ],

      'react/jsx-handler-names': 0,
      'react/jsx-indent': 0,
      'react/jsx-indent-props': [1, 2],

      'react/jsx-max-props-per-line': [
        1,
        {
          maximum: 3,
          when: 'multiline',
        },
      ],

      'react/jsx-no-literals': 0,
      'react/jsx-sort-props': 0,
      'react/no-multi-comp': 0,
      'react/no-set-state': 0,
      'react/prop-types': 0,
      'linebreak-style': [2, 'unix'],
      semi: [2, 'always'],
      'comma-dangle': [2, 'only-multiline'],
      'no-console': 0,
      'no-global-assign': 0,

      'no-unused-vars': [
        'warn',
        {
          vars: 'all',
          args: 'none',
          argsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
        },
      ],

      'no-multiple-empty-lines': [
        2,
        {
          max: 1,
        },
      ],

      'prefer-const': [
        'error',
        {
          destructuring: 'any',
          ignoreReadBeforeAssign: false,
        },
      ],
      'react/jsx-no-target-blank': 0,
      'react/no-unescaped-entities': 0,
      '@typescript-eslint/no-explicit-any': 0,
      '@typescript-eslint/no-var-requires': 0,
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          args: 'all',
          argsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
    },
  },
];
