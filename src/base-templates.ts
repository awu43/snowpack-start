export = new Map(Object.entries({
  blank: {
    prodPackages: [],
    devPackages: [],
    tsPackages: [],
    testPackages: [],
    plugins: [],
  },
  // Modified from blank to remove the confetti dependency
  react: {
    prodPackages: ["react", "react-dom"],
    devPackages: [
      "@snowpack/plugin-react-refresh",
      "@snowpack/plugin-dotenv",
    ],
    tsPackages: [
      "@types/react",
      "@types/react-dom",
    ],
    testPackages: ["@testing-library/react"],
    plugins: [
      "'@snowpack/plugin-react-refresh'",
      "'@snowpack/plugin-dotenv'",
    ],
  },
  "react-redux": {
    prodPackages: [
      "react",
      "react-dom",
      "@reduxjs/toolkit",
      "react-redux",
    ],
    devPackages: [
      "@snowpack/plugin-react-refresh",
      "@snowpack/plugin-dotenv",
    ],
    tsPackages: [
      "@types/react",
      "@types/react-dom",
      "@types/react-redux",
    ],
    testPackages: ["@testing-library/react"],
    plugins: [
      "'@snowpack/plugin-react-refresh'",
      "'@snowpack/plugin-dotenv'",
    ],
  },
  vue: {
    prodPackages: ["vue"],
    devPackages: [
      "@snowpack/plugin-vue",
      "@snowpack/plugin-dotenv",
    ],
    tsPackages: [],
    testPackages: ["@testing-library/vue"],
    plugins: [
      "'@snowpack/plugin-vue'",
      "'@snowpack/plugin-dotenv'",
    ],
  },
  svelte: {
    prodPackages: ["svelte"],
    devPackages: [
      "@snowpack/plugin-svelte",
      "@snowpack/plugin-dotenv",
    ],
    tsPackages: ["svelte-preprocess", "@tsconfig/svelte"],
    testPackages: ["@testing-library/svelte"],
    plugins: [
      "'@snowpack/plugin-svelte'",
      "'@snowpack/plugin-dotenv'",
    ],
  },
  preact: {
    prodPackages: ["preact"],
    devPackages: [
      "@prefresh/snowpack",
      "@snowpack/plugin-dotenv",
    ],
    tsPackages: [],
    testPackages: ["@testing-library/preact"],
    plugins: [
      "'@snowpack/plugin-dotenv'",
      "'@prefresh/snowpack'",
    ],
  },
  "lit-element": {
    prodPackages: ["lit-element", "lit-html"],
    devPackages: [
      "@babel/plugin-proposal-class-properties",
      "@babel/plugin-proposal-decorators",
      "@snowpack/plugin-babel",
      "@snowpack/plugin-dotenv",
    ],
    tsPackages: ["@babel/preset-typescript"],
    testPackages: [],
    plugins: [
      "'@snowpack/plugin-babel'",
      "'@snowpack/plugin-dotenv'",
    ],
  },
})) as BaseTemplateMap;
