module.exports = {
  env: {
    commonjs: true,
    es2021: true,
    node: true,
  },
  extends: [
    "airbnb-base",
  ],
  parserOptions: {
    ecmaVersion: 12,
  },
  rules: {
    quotes: ["error", "double"],
    "no-restricted-syntax": ["error", "ForInStatement", "LabeledStatement", "WithStatement"],
    "comma-dangle": ["error", "only-multiline"],
    "arrow-parens": ["error", "as-needed"],
    "no-else-return": "off",
    "max-classes-per-file": "off",
    "no-underscore-dangle": "off",
    "no-unneeded-ternary": "off", // Node doesn't support nullish operator
  },
  overrides: [{
    files: ["**/*.ts"],
    extends: [
      "plugin:@typescript-eslint/recommended",
    ],
    parser: "@typescript-eslint/parser",
    plugins: [
      "@typescript-eslint",
    ],
    rules: {
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": ["error", {
        varsIgnorePattern: "^_",
        argsIgnorePattern: "^_",
      }],
    },
  }]
};
