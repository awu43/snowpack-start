const path = require("path");

const TEMPLATE_NAMES = [
  "none",
  "react",
  "vue",
  "svelte",
  "preact",
  "lit-element",
];
const BASE_TEMPLATES = new Map();

for (const template of TEMPLATE_NAMES) {
  BASE_TEMPLATES.set(template, path.join(__dirname, template));
  BASE_TEMPLATES.set(
    `${template}-typescript`, path.join(__dirname, `${template}-typescript`)
  );
}

module.exports = BASE_TEMPLATES;
