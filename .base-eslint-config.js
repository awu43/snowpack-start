module.exports = {
  env: {
    commonjs: true,
    es2021: true,
    node: true,
    mocha: true,
  },
  extends: [
    "airbnb-base",
  ],
  parserOptions: {
    ecmaVersion: 12,
  },
  rules: {
    quotes: [2, "double"],
    "no-restricted-syntax": [2, "ForInStatement", "LabeledStatement", "WithStatement"],
    "comma-dangle": [2, "only-multiline"],
    "arrow-parens": [2, "as-needed"],
    "no-else-return": 0,
    "max-classes-per-file": 0,
    "no-underscore-dangle": 0,
    "no-unneeded-ternary": 0, // Node doesn't support nullish operator
    "no-continue": 0,
  },
}
