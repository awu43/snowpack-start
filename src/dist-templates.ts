import path = require("path");

const TEMPLATE_NAMES = [
  "blank",
  "react",
  "react-redux",
  "vue",
  "svelte",
  "preact",
  "lit-element",
];
const DIST_TEMPLATES = new Map();

for (const template of TEMPLATE_NAMES) {
  const distTemplatesDir = path.join(
    path.dirname(__dirname), "dist-templates"
  );
  DIST_TEMPLATES.set(template, path.join(distTemplatesDir, template));
  DIST_TEMPLATES.set(
    `${template}-typescript`,
    path.join(distTemplatesDir, `${template}-typescript`)
  );
}

export = DIST_TEMPLATES as DistPathMap;
