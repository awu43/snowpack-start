module.exports = new Map(Object.entries({
  blank: {
    prodPackages: [],
    devPackages: [],
    tsPackages: [],
    wtrPackages: [],
    plugins: [],
  },
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
    wtrPackages: ["@testing-library/react"],
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
    wtrPackages: ["@testing-library/vue"],
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
    tsPackages: ["svelte-preprocess"],
    wtrPackages: ["@testing-library/svelte"],
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
    wtrPackages: ["@testing-library/preact"],
    plugins: [
      "'@prefresh/snowpack'",
      "'@snowpack/plugin-dotenv'"
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
    wtrPackages: [],
    plugins: [
      "'@snowpack/plugin-babel'",
      "'@snowpack/plugin-dotenv'",
    ],
  },
}));
