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
      'prefer-const': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': 'warn',
      // TODO(pablo): REMOVE IN REVIEW
      '@typescript-eslint/no-this-alias': 'warn',
    }
  }
]
