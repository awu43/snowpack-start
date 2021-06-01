import path = require("path");

const BASE_FILES = new Map(Object.entries({
  gitignore: "gitignore.txt",

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
  const filePath = path.join(
    path.dirname(__dirname), "dist-files", basePath
  );
  BASE_FILES.set(baseKey, filePath);
}

module.exports = BASE_FILES;
