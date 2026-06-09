import { dirname } from 'path'
import { fileURLToPath } from 'url'
import { FlatCompat } from '@eslint/eslintrc'
import perfectionist from 'eslint-plugin-perfectionist'
import prettier from 'eslint-plugin-prettier'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const compat = new FlatCompat({
  baseDirectory: __dirname,
})

// eslint-disable-next-line import/no-anonymous-default-export
export default [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      'out/**',
      'build/**',
      'dist/**',
      'coverage/**',
      'public/**',
      'docker/**',
      '.husky/**',
      'next-env.d.ts',
    ],
  },
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: __dirname,
      },
    },
    plugins: { perfectionist },
    rules: {
      'perfectionist/sort-imports': [
        'error',
        {
          type: 'natural',
          order: 'asc',
          ignoreCase: true,
          newlinesBetween: 'always',
          internalPattern: ['^@/'],
          groups: [
            'type',
            'side-effect',
            'builtin',
            'external',
            'internal',
            ['parent', 'sibling', 'index'],
            'object',
            'unknown',
          ],
        },
      ],
      'perfectionist/sort-named-imports': [
        'error',
        {
          type: 'natural',
          order: 'asc',
          ignoreCase: true,
        },
      ],
      'perfectionist/sort-jsx-props': [
        'error',
        {
          type: 'unsorted',
          groups: [
            'key',
            'id',
            'type',
            'variant',
            'name',
            'class',
            'className',
            'shorthand-prop',
            'unknown',
            'callback',
          ],
          customGroups: [
            { groupName: 'key', elementNamePattern: '^key$' },
            { groupName: 'id', elementNamePattern: '^id$' },
            { groupName: 'type', elementNamePattern: '^type$' },
            { groupName: 'variant', elementNamePattern: '^variant$' },
            { groupName: 'name', elementNamePattern: '^name$' },
            { groupName: 'class', elementNamePattern: '^class$' },
            { groupName: 'className', elementNamePattern: '^className$' },
            { groupName: 'callback', elementNamePattern: '^on.+' },
          ],
        },
      ],
    },
  },
  {
    plugins: { prettier },
    rules: {
      'prettier/prettier': 'warn',
    },
  },
]
