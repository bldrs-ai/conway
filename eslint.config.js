import eslint from '@eslint/js'
import tslint from 'typescript-eslint'
import jsdoc from 'eslint-plugin-jsdoc'


export default [
  {
    files: ['**/*.js', '**/*.mjs', '**/*.jsx', '**/*.ts', '**/*.tsx'],
  },
  {
    ignores: [
      '**/ifc_functions.ts',
      'compiled',
      'external',
      'src/ifc/ifc4_gen',
      'src/AP214E3_2010/AP214E3_2010_gen',
      'src/shim/ifc2x4_helper.js',
      'src/shim/ifc2x4_helper.ts',
      'src/shim/ifc2x4.js',
      'src/shim/ifc2x4.ts',
      'src/shim/IFC4x2.ts',
      'src/shim/properties.ts',
      'src/shim/shim_schema_mapping.ts',
      'src/shim/types-map.ts',
    ],
  },
  eslint.configs.recommended,
  jsdoc.configs['flat/recommended-typescript'],
  ...tslint.config(
    eslint.configs.recommended,
    tslint.configs.recommended,
  ),
  {
    plugins: {
      jsdoc
    },
    rules: {
      semi: ['error', 'never'],
      'jsdoc/no-types': 'off',
      'jsdoc/tag-lines': ['warn', 'any', {startLines: 1}],
      'no-magic-numbers': ['error', {
        ignore: [-10, -9, -8, -7, -6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        ignoreArrayIndexes: true,
        ignoreClassFieldInitialValues: true,
        ignoreDefaultValues: true,
      }],
      'prefer-const': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': 'warn',
    },
    settings: {
      jsdoc: {
        tagNamePreference: {
          returns: 'return'
        }
      }
    }
  },
]
