const path = require("path");

const SOURCE_NAMES = [
  "blank",
  "react",
  "vue",
  "svelte",
  "preact",
  "lit-element",
];
const SOURCE_PATHS = new Map();

for (const template of SOURCE_NAMES) {
  SOURCE_PATHS.set(template, path.join(__dirname, template));
  SOURCE_PATHS.set(
    `${template}-typescript`, path.join(__dirname, `${template}-typescript`)
  );
}

const SOURCE_CONFIGS = new Map(Object.entries({
  blank: {
    baseTemplate: "blank",
    typescript: false,
    codeFormatters: ["prettier"],
    sass: false,
    cssFramework: null,
    bundler: null,
    plugins: [],
    license: "mit",
  },
  "blank-typescript": {
    baseTemplate: "blank",
    typescript: true,
    codeFormatters: ["prettier"],
    sass: false,
    cssFramework: null,
    bundler: null,
    plugins: [],
    license: "mit",
  },
  react: {
    baseTemplate: "react",
    typescript: false,
    codeFormatters: ["prettier"],
    sass: false,
    cssFramework: null,
    bundler: null,
    plugins: ["wtr"],
    license: "mit",
  },
  "react-typescript": {
    baseTemplate: "react",
    typescript: true,
    codeFormatters: ["prettier"],
    sass: false,
    cssFramework: null,
    bundler: null,
    plugins: ["wtr"],
    license: "mit",
  },
  vue: {
    baseTemplate: "vue",
    typescript: false,
    codeFormatters: [],
    sass: false,
    cssFramework: null,
    bundler: null,
    plugins: [],
    license: "mit",
  },
  "vue-typescript": {
    baseTemplate: "vue",
    typescript: true,
    codeFormatters: [],
    sass: false,
    cssFramework: null,
    bundler: null,
    plugins: [],
    license: "mit",
  },
  svelte: {
    baseTemplate: "svelte",
    typescript: false,
    codeFormatters: [],
    sass: false,
    cssFramework: null,
    bundler: null,
    plugins: ["wtr"],
    license: "mit",
  },
  "svelte-typescript": {
    baseTemplate: "svelte",
    typescript: true,
    codeFormatters: [],
    sass: false,
    cssFramework: null,
    bundler: null,
    plugins: ["wtr"],
    license: "mit",
  },
  preact: {
    baseTemplate: "preact",
    typescript: false,
    codeFormatters: ["prettier"],
    sass: false,
    cssFramework: null,
    bundler: null,
    plugins: ["wtr"],
    license: "mit",
  },
  "preact-typescript": {
    baseTemplate: "preact",
    typescript: true,
    codeFormatters: ["prettier"],
    sass: false,
    cssFramework: null,
    bundler: null,
    plugins: ["wtr"],
    license: "mit",
  },
  "lit-element": {
    baseTemplate: "lit-element",
    typescript: false,
    codeFormatters: ["prettier"],
    sass: false,
    cssFramework: null,
    bundler: null,
    plugins: [],
    license: "mit",
  },
  "lit-element-typescript": {
    baseTemplate: "lit-element",
    typescript: true,
    codeFormatters: ["prettier"],
    sass: false,
    cssFramework: null,
    bundler: null,
    plugins: [],
    license: "mit",
  },
}));

module.exports = {
  SOURCE_NAMES,
  SOURCE_PATHS,
  SOURCE_CONFIGS,
};
