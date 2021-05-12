module.exports = {
  env: {
    es2021: true,
    node: true,
  },
  extends: [
    "airbnb-base",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 12,
    sourceType: "module",
  },
  plugins: [
    "@typescript-eslint",
  ],
  rules: {
    quotes: ["error", "double"],
    "no-restricted-syntax": ["error", "ForInStatement", "LabeledStatement", "WithStatement"],
    "comma-dangle": ["error", "only-multiline"],
    "arrow-parens": ["error", "as-needed"],
    "no-else-return": [0],
    "max-classes-per-file": [0],
    "no-underscore-dangle": [0],

    "no-unused-vars": [0],
    "@typescript-eslint/no-unused-vars": ["error", {
      varsIgnorePattern: "^_",
      argsIgnorePattern: "^_",
    }],
  },
};
