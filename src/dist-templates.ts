import path = require("path");

const TEMPLATE_NAMES = [
  "blank",
  "react",
  "vue",
  "svelte",
  "preact",
  "lit-element",
];
const BASE_TEMPLATES = new Map();

for (const template of TEMPLATE_NAMES) {
  const distTemplatesDir = path.join(
    path.dirname(__dirname), "dist-templates"
  );
  BASE_TEMPLATES.set(template, path.join(distTemplatesDir, template));
  BASE_TEMPLATES.set(
    `${template}-typescript`,
    path.join(distTemplatesDir, `${template}-typescript`)
  );
}

export = BASE_TEMPLATES as DistPathMap;
