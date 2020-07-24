module.exports = {
    env: {
        browser: true,
        es6: true,
        node: true,
    },
    extends: [
        'plugin:@typescript-eslint/recommended',
        'plugin:@typescript-eslint/eslint-recommended',
        'prettier',
        'prettier/@typescript-eslint',
        'plugin:prettier/recommended',
        'plugin:import/errors',
        'plugin:import/warnings',
        'plugin:import/typescript',
    ],
    globals: {
        Atomics: 'readonly',
        SharedArrayBuffer: 'readonly',
    },
    parser: '@typescript-eslint/parser',
    parserOptions: {
        ecmaVersion: 2018,
        sourceType: 'module',
    },
    plugins: ['@typescript-eslint', 'prettier', 'import'],
    rules: {
        'prettier/prettier': [
            'error',
            {},
            {
                usePrettierrc: true,
            },
        ],
        '@typescript-eslint/brace-style': [
            'error',
            '1tbs',
            { allowSingleLine: true },
        ],
        '@typescript-eslint/explicit-function-return-type': 'off',
        '@typescript-eslint/func-call-spacing': ['error'],
        '@typescript-eslint/member-ordering': ['warn'],
        '@typescript-eslint/no-require-imports': ['error'],
        '@typescript-eslint/no-explicit-any': ['off'],
        '@typescript-eslint/no-unused-vars': [
            'error',
            {
                argsIgnorePattern: '^_',
                ignoreRestSiblings: true,
            },
        ],
        '@typescript-eslint/no-non-null-assertion': ['off'],
        '@typescript-eslint/semi': ['error', 'never'],
        '@typescript-eslint/explicit-module-boundary-types': ['off'],
        'array-bracket-spacing': ['warn', 'never'],
        'object-curly-spacing': ['warn', 'always'],
        quotes: ['error', 'single', { allowTemplateLiterals: true }],
        semi: 'off',
        'import/no-unresolved': 'off',
        'import/newline-after-import': ['error'],
        'import/no-default-export': ['error'],
        'import/order': [
            'error',
            {
                'newlines-between': 'always',
                groups: [
                    'builtin',
                    'external',
                    ['internal', 'parent', 'sibling', 'index'],
                ],
                pathGroups: [
                    {
                        pattern: 'src/**',
                        group: 'internal',
                    },
                ],
                pathGroupsExcludedImportTypes: ['builtin'],
            },
        ],
    },
}
