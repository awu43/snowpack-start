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
    jsFramework: "blank",
    typescript: false,
    codeFormatters: ["prettier"],
    sass: false,
    cssFramework: null,
    bundler: null,
    plugins: [],
    license: "mit",
  },
  "blank-typescript": {
    jsFramework: "blank",
    typescript: true,
    codeFormatters: ["prettier"],
    sass: false,
    cssFramework: null,
    bundler: null,
    plugins: [],
    license: "mit",
  },
  react: {
    jsFramework: "react",
    typescript: false,
    codeFormatters: ["prettier"],
    sass: false,
    cssFramework: null,
    bundler: null,
    plugins: ["wtr"],
    license: "mit",
  },
  "react-typescript": {
    jsFramework: "react",
    typescript: true,
    codeFormatters: ["prettier"],
    sass: false,
    cssFramework: null,
    bundler: null,
    plugins: ["wtr"],
    license: "mit",
  },
  vue: {
    jsFramework: "vue",
    typescript: false,
    codeFormatters: [],
    sass: false,
    cssFramework: null,
    bundler: null,
    plugins: [],
    license: "mit",
  },
  "vue-typescript": {
    jsFramework: "vue",
    typescript: true,
    codeFormatters: [],
    sass: false,
    cssFramework: null,
    bundler: null,
    plugins: [],
    license: "mit",
  },
  svelte: {
    jsFramework: "svelte",
    typescript: false,
    codeFormatters: [],
    sass: false,
    cssFramework: null,
    bundler: null,
    plugins: ["wtr"],
    license: "mit",
  },
  "svelte-typescript": {
    jsFramework: "svelte",
    typescript: true,
    codeFormatters: [],
    sass: false,
    cssFramework: null,
    bundler: null,
    plugins: ["wtr"],
    license: "mit",
  },
  preact: {
    jsFramework: "preact",
    typescript: false,
    codeFormatters: ["prettier"],
    sass: false,
    cssFramework: null,
    bundler: null,
    plugins: ["wtr"],
    license: "mit",
  },
  "preact-typescript": {
    jsFramework: "preact",
    typescript: true,
    codeFormatters: ["prettier"],
    sass: false,
    cssFramework: null,
    bundler: null,
    plugins: ["wtr"],
    license: "mit",
  },
  "lit-element": {
    jsFramework: "lit-element",
    typescript: false,
    codeFormatters: ["prettier"],
    sass: false,
    cssFramework: null,
    bundler: null,
    plugins: [],
    license: "mit",
  },
  "lit-element-typescript": {
    jsFramework: "lit-element",
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
