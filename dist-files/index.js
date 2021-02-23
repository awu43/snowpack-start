const path = require("path");

const BASE_FILES = new Map(Object.entries({
  gitignore: ".gitignore",

  gpl: "license/GPL",
  mit: "license/MIT",
  apache: "license/Apache",

  svelteConfig: "config/svelte.config.js",
  prettierConfig: "config/.prettierrc",
  postcssConfig: "config/postcss.config.js",
  wtrConfig: "config/web-test-runner.config.js",
  snowpackConfig: "config/snowpack.config.js",
}));

for (const [baseKey, basePath] of BASE_FILES.entries()) {
  BASE_FILES.set(baseKey, path.join(__dirname, basePath));
}

module.exports = BASE_FILES;
