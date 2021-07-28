module.exports = {
  extends: ["./.base-eslint-config.js"],
  overrides: [{
    files: ["**/*.ts"],
    extends: [
      "./.base-eslint-config.js",
      "plugin:@typescript-eslint/eslint-recommended",
      "plugin:@typescript-eslint/recommended",
    ],
    parser: "@typescript-eslint/parser",
    plugins: [
      "@typescript-eslint",
    ],
    rules: {
      "@typescript-eslint/no-var-requires": 0,
    },
  }]
};
